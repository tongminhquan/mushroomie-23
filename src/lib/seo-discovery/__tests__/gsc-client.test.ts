import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vitest'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import {
  GscClientError,
  type GoogleSearchConsoleClient,
  type GoogleSearchConsoleFullClient,
  type SearchAnalyticsRequest,
} from '@/lib/seo-discovery/gsc-client'
import {
  createGoogleSearchConsoleClient,
  createGoogleSearchConsoleProbeClient,
} from '@/lib/seo-discovery/google-gsc-client'

const googleAuthMocks = vi.hoisted(() => ({
  constructedWith: vi.fn(),
  getRequestHeaders: vi.fn(),
}))

const temporaryDirectories: string[] = []

const B30_SEARCH_ANALYTICS_REQUEST: SearchAnalyticsRequest = {
  startDate: '2026-07-12',
  endDate: '2026-08-09',
  query: 'vòng tay handmade Đồng Nai',
}

const VALID_SEARCH_ANALYTICS_ROW = {
  keys: [
    'Vòng tay Handmade Đồng Nai',
    'https://mushroomie.io.vn/vong-tay-handmade-dong-nai',
    'MOBILE',
  ],
  clicks: 2,
  impressions: 20,
  ctr: 0.1,
  position: 3.5,
}

async function createExternalCredentialFile(
  contents = '{"type":"service_account"}',
): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), 'mushroomie-gsc-'))
  temporaryDirectories.push(directory)
  const credentialPath = path.join(directory, 'service-account.json')
  await writeFile(credentialPath, contents, 'utf8')
  return credentialPath
}

async function createEnabledClient(fetchMock: typeof fetch) {
  const credentialPath = await createExternalCredentialFile()
  return {
    credentialPath,
    client: createGoogleSearchConsoleClient({
      env: {
        SEO_DISCOVERY_ENABLED: 'true',
        GSC_INTEGRATION_ENABLED: 'true',
        GSC_PROPERTY: 'sc-domain:mushroomie.io.vn',
        GOOGLE_APPLICATION_CREDENTIALS: credentialPath,
      },
      fetch: fetchMock,
      repositoryRoot: process.cwd(),
    }),
  }
}

vi.mock('google-auth-library', () => ({
  GoogleAuth: class MockGoogleAuth {
    constructor(options: unknown) {
      googleAuthMocks.constructedWith(options)
    }

    getRequestHeaders(url?: string | URL) {
      return googleAuthMocks.getRequestHeaders(url)
    }
  },
}))

describe('createGoogleSearchConsoleClient', () => {
  beforeEach(() => {
    googleAuthMocks.getRequestHeaders.mockResolvedValue(new Headers({
      authorization: 'Bearer test-token',
    }))
  })

  afterEach(async () => {
    vi.useRealTimers()
    await Promise.all(temporaryDirectories.splice(0).map((directory) => (
      rm(directory, { recursive: true, force: true })
    )))
  })

  it('exposes Search Analytics only from the full client factory contract', () => {
    expectTypeOf<ReturnType<typeof createGoogleSearchConsoleClient>>()
      .toEqualTypeOf<GoogleSearchConsoleFullClient>()
    expectTypeOf<ReturnType<typeof createGoogleSearchConsoleProbeClient>>()
      .toEqualTypeOf<GoogleSearchConsoleClient>()
  })

  it('stays disabled without constructing auth or making a network request', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    const client = createGoogleSearchConsoleClient({
      env: {
        SEO_DISCOVERY_ENABLED: 'false',
        GSC_INTEGRATION_ENABLED: 'false',
      },
      fetch: fetchMock,
      repositoryRoot: process.cwd(),
    })

    await expect(client.getConnectionStatus()).resolves.toEqual({
      state: 'disabled',
      code: 'GSC_DISABLED',
    })
    for (const operation of [
      client.listSitemaps(),
      client.submitSitemap('https://mushroomie.io.vn/sitemap.xml'),
      client.inspectUrl('https://mushroomie.io.vn/tin-tuc/vong-tay-do'),
      client.querySearchAnalytics(B30_SEARCH_ANALYTICS_REQUEST),
    ]) {
      await expect(operation).rejects.toBeInstanceOf(GscClientError)
      await expect(operation).rejects.toMatchObject({
        code: 'GSC_DISABLED',
        retryable: false,
        configurationRequired: false,
        httpStatus: null,
      })
    }
    expect(googleAuthMocks.constructedWith).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('keeps the worker client disabled while an admin probe verifies both GSC APIs', async () => {
    const credentialPath = await createExternalCredentialFile()
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ sitemap: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        inspectionResult: {
          indexStatusResult: {
            verdict: 'NEUTRAL',
            coverageState: 'URL is unknown to Google',
          },
        },
      }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }))
    const options = {
      env: {
        SEO_DISCOVERY_ENABLED: 'true',
        GSC_INTEGRATION_ENABLED: 'false',
        GSC_PROPERTY: 'sc-domain:mushroomie.io.vn',
        GOOGLE_APPLICATION_CREDENTIALS: credentialPath,
      },
      fetch: fetchMock,
      repositoryRoot: process.cwd(),
    }

    const workerClient = createGoogleSearchConsoleClient(options)
    await expect(workerClient.getConnectionStatus()).resolves.toEqual({
      state: 'disabled',
      code: 'GSC_DISABLED',
    })
    expect(fetchMock).not.toHaveBeenCalled()

    const probeClient = createGoogleSearchConsoleProbeClient(options)
    await expect(probeClient.getConnectionStatus()).resolves.toEqual({
      state: 'connected',
      code: 'GSC_CONNECTED',
      property: 'sc-domain:mushroomie.io.vn',
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      'https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Amushroomie.io.vn/sitemaps',
    )
    expect(fetchMock.mock.calls[1]?.[0]).toBe(
      'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
    )
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toEqual({
      inspectionUrl: 'https://mushroomie.io.vn/',
      siteUrl: 'sc-domain:mushroomie.io.vn',
    })
  })

  it('keeps Search Analytics disabled on a probe even after a runtime cast', async () => {
    const credentialPath = await createExternalCredentialFile()
    const fetchMock = vi.fn<typeof fetch>()
    const probeClient = createGoogleSearchConsoleProbeClient({
      env: {
        SEO_DISCOVERY_ENABLED: 'true',
        GSC_INTEGRATION_ENABLED: 'false',
        GSC_PROPERTY: 'sc-domain:mushroomie.io.vn',
        GOOGLE_APPLICATION_CREDENTIALS: credentialPath,
      },
      fetch: fetchMock,
      repositoryRoot: process.cwd(),
    }) as GoogleSearchConsoleFullClient

    await expect(probeClient.querySearchAnalytics(B30_SEARCH_ANALYTICS_REQUEST))
      .rejects.toMatchObject({
        code: 'GSC_DISABLED',
        retryable: false,
        configurationRequired: false,
        httpStatus: null,
      })
    expect(googleAuthMocks.getRequestHeaders).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('keeps probe Search Analytics disabled when credentials are missing', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    const probeClient = createGoogleSearchConsoleProbeClient({
      env: {
        SEO_DISCOVERY_ENABLED: 'true',
        GSC_INTEGRATION_ENABLED: 'false',
        GSC_PROPERTY: 'sc-domain:mushroomie.io.vn',
      },
      fetch: fetchMock,
      repositoryRoot: process.cwd(),
    }) as GoogleSearchConsoleFullClient

    await expect(probeClient.querySearchAnalytics(B30_SEARCH_ANALYTICS_REQUEST))
      .rejects.toMatchObject({
        code: 'GSC_DISABLED',
        retryable: false,
        configurationRequired: false,
        httpStatus: null,
      })
    expect(googleAuthMocks.constructedWith).not.toHaveBeenCalled()
    expect(googleAuthMocks.getRequestHeaders).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('keeps probe Search Analytics disabled when credentials are invalid', async () => {
    const credentialPath = await createExternalCredentialFile(JSON.stringify({
      type: 'external_account',
    }))
    const fetchMock = vi.fn<typeof fetch>()
    const probeClient = createGoogleSearchConsoleProbeClient({
      env: {
        SEO_DISCOVERY_ENABLED: 'true',
        GSC_INTEGRATION_ENABLED: 'false',
        GSC_PROPERTY: 'sc-domain:mushroomie.io.vn',
        GOOGLE_APPLICATION_CREDENTIALS: credentialPath,
      },
      fetch: fetchMock,
      repositoryRoot: process.cwd(),
    }) as GoogleSearchConsoleFullClient

    await expect(probeClient.querySearchAnalytics(B30_SEARCH_ANALYTICS_REQUEST))
      .rejects.toMatchObject({
        code: 'GSC_DISABLED',
        retryable: false,
        configurationRequired: false,
        httpStatus: null,
      })
    expect(googleAuthMocks.constructedWith).not.toHaveBeenCalled()
    expect(googleAuthMocks.getRequestHeaders).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not let the admin probe bypass the discovery master switch', async () => {
    const credentialPath = await createExternalCredentialFile()
    const fetchMock = vi.fn<typeof fetch>()
    const client = createGoogleSearchConsoleProbeClient({
      env: {
        SEO_DISCOVERY_ENABLED: 'false',
        GSC_INTEGRATION_ENABLED: 'false',
        GSC_PROPERTY: 'sc-domain:mushroomie.io.vn',
        GOOGLE_APPLICATION_CREDENTIALS: credentialPath,
      },
      fetch: fetchMock,
      repositoryRoot: process.cwd(),
    })

    await expect(client.getConnectionStatus()).resolves.toEqual({
      state: 'disabled',
      code: 'GSC_DISABLED',
    })
    expect(googleAuthMocks.constructedWith).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('requires configuration without constructing auth when credentials are missing', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    const client = createGoogleSearchConsoleClient({
      env: {
        SEO_DISCOVERY_ENABLED: 'true',
        GSC_INTEGRATION_ENABLED: 'true',
      },
      fetch: fetchMock,
      repositoryRoot: process.cwd(),
    })

    await expect(client.getConnectionStatus()).resolves.toEqual({
      state: 'configuration_required',
      code: 'GSC_CONFIGURATION_REQUIRED',
    })
    await expect(client.listSitemaps()).rejects.toBeInstanceOf(GscClientError)
    await expect(client.listSitemaps()).rejects.toMatchObject({
      code: 'GSC_CONFIGURATION_REQUIRED',
      retryable: false,
      configurationRequired: true,
      httpStatus: null,
    })
    await expect(client.querySearchAnalytics(B30_SEARCH_ANALYTICS_REQUEST))
      .rejects.toMatchObject({
        code: 'GSC_CONFIGURATION_REQUIRED',
        retryable: false,
        configurationRequired: true,
        httpStatus: null,
      })
    expect(googleAuthMocks.constructedWith).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not borrow process credentials when an explicit environment is supplied', async () => {
    const processCredentialPath = await createExternalCredentialFile()
    vi.stubEnv('GOOGLE_APPLICATION_CREDENTIALS', processCredentialPath)
    const fetchMock = vi.fn<typeof fetch>()
    const client = createGoogleSearchConsoleClient({
      env: {
        SEO_DISCOVERY_ENABLED: 'true',
        GSC_INTEGRATION_ENABLED: 'true',
        GSC_PROPERTY: 'sc-domain:mushroomie.io.vn',
      },
      fetch: fetchMock,
      repositoryRoot: process.cwd(),
    })

    await expect(client.getConnectionStatus()).resolves.toEqual({
      state: 'configuration_required',
      code: 'GSC_CONFIGURATION_REQUIRED',
    })
    expect(googleAuthMocks.constructedWith).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('requires configuration when the credential path is inside the repository', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    const client = createGoogleSearchConsoleClient({
      env: {
        SEO_DISCOVERY_ENABLED: 'true',
        GSC_INTEGRATION_ENABLED: 'true',
        GSC_PROPERTY: 'sc-domain:mushroomie.io.vn',
        GOOGLE_APPLICATION_CREDENTIALS: path.join(process.cwd(), 'package.json'),
      },
      fetch: fetchMock,
      repositoryRoot: process.cwd(),
    })

    await expect(client.getConnectionStatus()).resolves.toEqual({
      state: 'configuration_required',
      code: 'GSC_CONFIGURATION_REQUIRED',
    })
    expect(googleAuthMocks.constructedWith).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('requires configuration when the credential path is not a regular file', async () => {
    const credentialDirectory = await mkdtemp(path.join(tmpdir(), 'mushroomie-gsc-directory-'))
    temporaryDirectories.push(credentialDirectory)
    const fetchMock = vi.fn<typeof fetch>()
    const client = createGoogleSearchConsoleClient({
      env: {
        SEO_DISCOVERY_ENABLED: 'true',
        GSC_INTEGRATION_ENABLED: 'true',
        GSC_PROPERTY: 'sc-domain:mushroomie.io.vn',
        GOOGLE_APPLICATION_CREDENTIALS: credentialDirectory,
      },
      fetch: fetchMock,
      repositoryRoot: process.cwd(),
    })

    await expect(client.getConnectionStatus()).resolves.toEqual({
      state: 'configuration_required',
      code: 'GSC_CONFIGURATION_REQUIRED',
    })
    expect(googleAuthMocks.constructedWith).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects non-service-account credential configurations before auth', async () => {
    const credentialPath = await createExternalCredentialFile(JSON.stringify({
      type: 'external_account',
      credential_source: {
        url: 'http://169.254.169.254/credential-source-redaction-sentinel',
      },
    }))
    const fetchMock = vi.fn<typeof fetch>()
    const client = createGoogleSearchConsoleClient({
      env: {
        SEO_DISCOVERY_ENABLED: 'true',
        GSC_INTEGRATION_ENABLED: 'true',
        GSC_PROPERTY: 'sc-domain:mushroomie.io.vn',
        GOOGLE_APPLICATION_CREDENTIALS: credentialPath,
      },
      fetch: fetchMock,
      repositoryRoot: process.cwd(),
    })

    await expect(client.getConnectionStatus()).resolves.toEqual({
      state: 'configuration_required',
      code: 'GSC_CONFIGURATION_REQUIRED',
    })
    expect(googleAuthMocks.constructedWith).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('connects through the canonical sitemap endpoint with least-privilege auth', async () => {
    const credentialPath = await createExternalCredentialFile()
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => (
      new Response(JSON.stringify({ sitemap: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    ))
    const client = createGoogleSearchConsoleClient({
      env: {
        SEO_DISCOVERY_ENABLED: 'true',
        GSC_INTEGRATION_ENABLED: 'true',
        GSC_PROPERTY: 'sc-domain:mushroomie.io.vn',
        GOOGLE_APPLICATION_CREDENTIALS: credentialPath,
      },
      fetch: fetchMock,
      repositoryRoot: process.cwd(),
    })

    await expect(client.getConnectionStatus()).resolves.toEqual({
      state: 'connected',
      code: 'GSC_CONNECTED',
      property: 'sc-domain:mushroomie.io.vn',
    })
    expect(googleAuthMocks.constructedWith).toHaveBeenCalledWith({
      keyFilename: credentialPath,
      scopes: ['https://www.googleapis.com/auth/webmasters'],
      clientOptions: {
        transporterOptions: {
          timeout: 15_000,
        },
      },
    })
    const endpoint = 'https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Amushroomie.io.vn/sitemaps'
    expect(googleAuthMocks.getRequestHeaders).toHaveBeenCalledWith(endpoint)
    expect(fetchMock).toHaveBeenCalledWith(endpoint, expect.objectContaining({
      method: 'GET',
      redirect: 'error',
      signal: expect.any(AbortSignal),
    }))
  })

  it('queries exact B30 evidence through the canonical Search Analytics endpoint', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      rows: [{
        ...VALID_SEARCH_ANALYTICS_ROW,
        providerOnlyField: 'raw-google-response-sentinel',
      }],
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }))
    const { client } = await createEnabledClient(fetchMock)

    const rows = await client.querySearchAnalytics(B30_SEARCH_ANALYTICS_REQUEST)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(
      'https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Amushroomie.io.vn/searchAnalytics/query',
    )
    expect(init).toMatchObject({
      method: 'POST',
      redirect: 'error',
      signal: expect.any(AbortSignal),
    })
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer test-token')
    expect(new Headers(init?.headers).get('content-type')).toBe('application/json')
    expect(JSON.parse(String(init?.body))).toEqual({
      startDate: '2026-07-12',
      endDate: '2026-08-09',
      type: 'web',
      dataState: 'final',
      dimensions: ['query', 'page', 'device'],
      aggregationType: 'auto',
      rowLimit: 25_000,
      dimensionFilterGroups: [{
        groupType: 'and',
        filters: [
          { dimension: 'country', operator: 'equals', expression: 'VNM' },
          {
            dimension: 'query',
            operator: 'contains',
            expression: 'vòng tay handmade Đồng Nai',
          },
        ],
      }],
    })
    expect(rows).toEqual([{
      query: 'Vòng tay Handmade Đồng Nai',
      page: 'https://mushroomie.io.vn/vong-tay-handmade-dong-nai',
      device: 'MOBILE',
      clicks: 2,
      impressions: 20,
      ctr: 0.1,
      position: 3.5,
    }])
  })

  it('rejects a noncanonical Search Analytics property before auth or fetch', async () => {
    const credentialPath = await createExternalCredentialFile()
    const fetchMock = vi.fn<typeof fetch>()
    const client = createGoogleSearchConsoleClient({
      env: {
        SEO_DISCOVERY_ENABLED: 'true',
        GSC_INTEGRATION_ENABLED: 'true',
        GSC_PROPERTY: 'sc-domain:other.example',
        GOOGLE_APPLICATION_CREDENTIALS: credentialPath,
      },
      fetch: fetchMock,
      repositoryRoot: process.cwd(),
    })

    await expect(client.querySearchAnalytics(B30_SEARCH_ANALYTICS_REQUEST))
      .rejects.toMatchObject({
        code: 'GSC_CONFIGURATION_REQUIRED',
        retryable: false,
        configurationRequired: true,
        httpStatus: null,
      })
    expect(googleAuthMocks.getRequestHeaders).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('maps a Search Analytics response without rows to an empty result', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }))
    const { client } = await createEnabledClient(fetchMock)

    await expect(client.querySearchAnalytics(B30_SEARCH_ANALYTICS_REQUEST))
      .resolves.toEqual([])
  })

  it.each([
    ['top-level payload', []],
    ['rows shape', { rows: {} }],
    ['key count', {
      rows: [{ ...VALID_SEARCH_ANALYTICS_ROW, keys: ['query', 'page'] }],
    }],
    ['key type', {
      rows: [{ ...VALID_SEARCH_ANALYTICS_ROW, keys: ['query', 7, 'MOBILE'] }],
    }],
    ['device', {
      rows: [{ ...VALID_SEARCH_ANALYTICS_ROW, keys: ['query', 'page', 'PHONE'] }],
    }],
    ['negative count', {
      rows: [{ ...VALID_SEARCH_ANALYTICS_ROW, clicks: -1 }],
    }],
    ['non-numeric count', {
      rows: [{ ...VALID_SEARCH_ANALYTICS_ROW, impressions: '20' }],
    }],
    [
      'non-finite metric',
      '{"rows":[{"keys":["query","page","MOBILE"],"clicks":2,"impressions":20,"ctr":0.1,"position":1e400}]}',
    ],
    ['out-of-range CTR', {
      rows: [{ ...VALID_SEARCH_ANALYTICS_ROW, ctr: 1.01 }],
    }],
    ['negative position', {
      rows: [{ ...VALID_SEARCH_ANALYTICS_ROW, position: -0.1 }],
    }],
  ])('rejects a malformed Search Analytics %s with a stable error', async (
    _label,
    payload,
  ) => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(
      typeof payload === 'string' ? payload : JSON.stringify(payload),
      {
        status: 200,
        headers: { 'content-type': 'application/json' },
      },
    ))
    const { client } = await createEnabledClient(fetchMock)

    const error = await client.querySearchAnalytics(B30_SEARCH_ANALYTICS_REQUEST)
      .catch((caught) => caught)

    expect(error).toBeInstanceOf(GscClientError)
    expect(error).toMatchObject({
      code: 'GSC_INVALID_RESPONSE',
      retryable: false,
      configurationRequired: false,
      httpStatus: null,
    })
    expect(String(error)).not.toContain('Vòng tay Handmade Đồng Nai')
  })

  it.each([
    ['request shape', null as unknown as SearchAnalyticsRequest],
    ['start date shape', { ...B30_SEARCH_ANALYTICS_REQUEST, startDate: '2026-7-12' }],
    ['end date shape', { ...B30_SEARCH_ANALYTICS_REQUEST, endDate: '2026/08/09' }],
    ['date ordering', {
      ...B30_SEARCH_ANALYTICS_REQUEST,
      startDate: '2026-08-10',
      endDate: '2026-08-09',
    }],
    ['empty query', { ...B30_SEARCH_ANALYTICS_REQUEST, query: ' \t ' }],
    ['query type', {
      ...B30_SEARCH_ANALYTICS_REQUEST,
      query: 7 as unknown as string,
    }],
    ['query length', { ...B30_SEARCH_ANALYTICS_REQUEST, query: 'x'.repeat(4_097) }],
  ])('rejects invalid Search Analytics %s before auth or fetch', async (
    _label,
    request,
  ) => {
    const fetchMock = vi.fn<typeof fetch>()
    const { client } = await createEnabledClient(fetchMock)

    await expect(client.querySearchAnalytics(request)).rejects.toMatchObject({
      code: 'GSC_INVALID_RESPONSE',
      retryable: false,
      configurationRequired: false,
      httpStatus: null,
    })
    expect(googleAuthMocks.getRequestHeaders).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('normalizes and trims the Search Analytics query before transport', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }))
    const { client } = await createEnabledClient(fetchMock)

    await client.querySearchAnalytics({
      ...B30_SEARCH_ANALYTICS_REQUEST,
      query: '  vo\u0300ng tay handmade Đồng Nai  ',
    })

    const requestBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))
    expect(requestBody.dimensionFilterGroups[0].filters[1].expression)
      .toBe('vòng tay handmade Đồng Nai')
  })

  it('accepts a Search Analytics query at the 4096-character limit', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response('{}', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }))
    const { client } = await createEnabledClient(fetchMock)
    const query = 'x'.repeat(4_096)

    await expect(client.querySearchAnalytics({
      ...B30_SEARCH_ANALYTICS_REQUEST,
      query,
    })).resolves.toEqual([])

    const requestBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body))
    expect(requestBody.dimensionFilterGroups[0].filters[1].expression).toBe(query)
  })

  it('maps only the supported sitemap status fields', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      sitemap: [{
        path: 'https://mushroomie.io.vn/sitemap.xml',
        lastSubmitted: '2026-08-11T03:00:00.000Z',
        isPending: false,
        isSitemapsIndex: false,
        type: 'WEB',
        lastDownloaded: '2026-08-11T04:00:00.000Z',
        warnings: '1',
        errors: '0',
        contents: [{ type: 'web', submitted: '120', indexed: '115' }],
        ignoredSecret: 'raw-google-response-sentinel',
      }],
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }))
    const { client } = await createEnabledClient(fetchMock)

    await expect(client.listSitemaps()).resolves.toEqual([{
      url: 'https://mushroomie.io.vn/sitemap.xml',
      lastSubmitted: '2026-08-11T03:00:00.000Z',
      lastDownloaded: '2026-08-11T04:00:00.000Z',
      pending: false,
      warnings: 1,
      errors: 0,
    }])
  })

  it('maps malformed sitemap counters to null instead of inventing zeroes', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      sitemap: [{
        path: 'https://mushroomie.io.vn/sitemap.xml',
        warnings: '',
        errors: 'not-a-count',
      }],
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }))
    const { client } = await createEnabledClient(fetchMock)

    await expect(client.listSitemaps()).resolves.toEqual([{
      url: 'https://mushroomie.io.vn/sitemap.xml',
      lastSubmitted: null,
      lastDownloaded: null,
      pending: false,
      warnings: null,
      errors: null,
    }])
  })

  it('submits only the canonical sitemap with encoded property and feed path', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, {
      status: 204,
    }))
    const { client } = await createEnabledClient(fetchMock)
    const sitemapUrl = 'https://mushroomie.io.vn/sitemap.xml'

    await expect(client.submitSitemap(sitemapUrl)).resolves.toBeUndefined()

    const endpoint = 'https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Amushroomie.io.vn/sitemaps/https%3A%2F%2Fmushroomie.io.vn%2Fsitemap.xml'
    expect(googleAuthMocks.getRequestHeaders).toHaveBeenCalledWith(endpoint)
    expect(fetchMock).toHaveBeenCalledWith(endpoint, expect.objectContaining({
      method: 'PUT',
      signal: expect.any(AbortSignal),
    }))
    const request = fetchMock.mock.calls[0]?.[1]
    expect(request).not.toHaveProperty('body')
    expect(new Headers(request?.headers).get('authorization')).toBe('Bearer test-token')
  })

  it('inspects an eligible production URL through the read-only inspection endpoint', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      inspectionResult: {
        inspectionResultLink: 'https://search.google.com/search-console/inspect',
        indexStatusResult: {
          verdict: 'PASS',
          coverageState: 'Submitted and indexed',
          robotsTxtState: 'ALLOWED',
          indexingState: 'INDEXING_ALLOWED',
          lastCrawlTime: '2026-08-11T02:00:00.000Z',
          pageFetchState: 'SUCCESSFUL',
          googleCanonical: 'https://mushroomie.io.vn/tin-tuc/vong-tay-do',
          userCanonical: 'https://mushroomie.io.vn/tin-tuc/vong-tay-do',
          referringUrls: ['https://mushroomie.io.vn/tin-tuc'],
          sitemap: ['https://mushroomie.io.vn/sitemap.xml'],
        },
        mobileUsabilityResult: { verdict: 'PASS', issues: [] },
        richResultsResult: { verdict: 'PASS', detectedItems: [] },
      },
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }))
    const { client } = await createEnabledClient(fetchMock)
    const inspectedUrl = 'https://mushroomie.io.vn/tin-tuc/vong-tay-do'

    await expect(client.inspectUrl(inspectedUrl)).resolves.toEqual({
      verdict: 'PASS',
      coverageState: 'Submitted and indexed',
      robotsTxtState: 'ALLOWED',
      indexingState: 'INDEXING_ALLOWED',
      pageFetchState: 'SUCCESSFUL',
      googleCanonical: inspectedUrl,
      userCanonical: inspectedUrl,
      lastCrawlTime: '2026-08-11T02:00:00.000Z',
    })

    const endpoint = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect'
    expect(googleAuthMocks.getRequestHeaders).toHaveBeenCalledWith(endpoint)
    expect(fetchMock).toHaveBeenCalledWith(endpoint, expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({
        inspectionUrl: inspectedUrl,
        siteUrl: 'sc-domain:mushroomie.io.vn',
      }),
      signal: expect.any(AbortSignal),
    }))
    const request = fetchMock.mock.calls[0]?.[1]
    expect(new Headers(request?.headers).get('content-type')).toBe('application/json')
    expect(new Headers(request?.headers).get('authorization')).toBe('Bearer test-token')
  })

  it.each([
    ['sitemap', async (client: ReturnType<typeof createGoogleSearchConsoleClient>) => (
      client.submitSitemap('https://mushroomie.io.vn/tin-tuc/khong-phai-sitemap')
    )],
    ['inspection', async (client: ReturnType<typeof createGoogleSearchConsoleClient>) => (
      client.inspectUrl('https://mushroomie.io.vn.evil.test/tin-tuc/token-sentinel')
    )],
  ])('rejects a non-production %s target before auth or fetch', async (_label, run) => {
    const fetchMock = vi.fn<typeof fetch>()
    const { client } = await createEnabledClient(fetchMock)

    await expect(run(client)).rejects.toBeInstanceOf(GscClientError)
    await expect(run(client)).rejects.toMatchObject({
      code: 'GSC_INVALID_URL',
      retryable: false,
      configurationRequired: false,
      httpStatus: null,
    })
    expect(googleAuthMocks.getRequestHeaders).not.toHaveBeenCalled()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([
    [401, 'GSC_UNAUTHORIZED', false, true],
    [403, 'GSC_FORBIDDEN', false, true],
    [404, 'GSC_NOT_FOUND', false, false],
    [429, 'GSC_RATE_LIMITED', true, false],
    [503, 'GSC_SERVER_ERROR', true, false],
  ] as const)(
    'maps Search Analytics HTTP %i to the typed, redacted %s error',
    async (status, code, retryable, configurationRequired) => {
      const responseSecret = `google-response-secret-${status}`
      const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(
        responseSecret,
        { status },
      ))
      const { client, credentialPath } = await createEnabledClient(fetchMock)

      const error = await client.querySearchAnalytics(B30_SEARCH_ANALYTICS_REQUEST)
        .catch((caught) => caught)
      expect(error).toBeInstanceOf(GscClientError)
      expect(error).toMatchObject({
        code,
        retryable,
        configurationRequired,
        httpStatus: status,
      })
      expect(String(error)).not.toContain(responseSecret)
      expect(String(error)).not.toContain(credentialPath)
    },
  )

  it('cancels a Search Analytics HTTP error body without masking the typed error', async () => {
    const cancellationSecret = 'provider-body-cancellation-secret'
    const cancelBody = vi.fn().mockRejectedValue(new Error(cancellationSecret))
    const responseBody = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('rate-limit-response-secret'))
      },
      cancel: cancelBody,
    })
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(
      responseBody,
      { status: 429 },
    ))
    const { client } = await createEnabledClient(fetchMock)

    const error = await client.querySearchAnalytics(B30_SEARCH_ANALYTICS_REQUEST)
      .catch((caught) => caught)

    expect(error).toBeInstanceOf(GscClientError)
    expect(error).toMatchObject({
      code: 'GSC_RATE_LIMITED',
      retryable: true,
      configurationRequired: false,
      httpStatus: 429,
    })
    expect(String(error)).not.toContain(cancellationSecret)
    expect(cancelBody).toHaveBeenCalledOnce()
  })

  it('redacts Search Analytics authentication failures without making a request', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    const { client, credentialPath } = await createEnabledClient(fetchMock)
    googleAuthMocks.getRequestHeaders.mockRejectedValueOnce(new Error(
      `private key rejected at ${credentialPath}`,
    ))

    const error = await client.querySearchAnalytics(B30_SEARCH_ANALYTICS_REQUEST)
      .catch((caught) => caught)
    expect(error).toBeInstanceOf(GscClientError)
    expect(error).toMatchObject({
      code: 'GSC_AUTHENTICATION_FAILED',
      retryable: false,
      configurationRequired: true,
      httpStatus: null,
    })
    expect(String(error)).not.toContain(credentialPath)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('redacts Search Analytics network failures as retryable typed errors', async () => {
    const networkSecret = 'https://private.invalid/?token=network-secret'
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(new Error(networkSecret))
    const { client } = await createEnabledClient(fetchMock)

    const error = await client.querySearchAnalytics(B30_SEARCH_ANALYTICS_REQUEST)
      .catch((caught) => caught)
    expect(error).toBeInstanceOf(GscClientError)
    expect(error).toMatchObject({
      code: 'GSC_NETWORK_ERROR',
      retryable: true,
      configurationRequired: false,
      httpStatus: null,
    })
    expect(String(error)).not.toContain(networkSecret)
  })

  it('rejects a malformed inspection response with a stable redacted error', async () => {
    const responseSecret = 'malformed-google-response-secret'
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({
      inspectionResult: { responseSecret },
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }))
    const { client } = await createEnabledClient(fetchMock)

    const error = await client.inspectUrl(
      'https://mushroomie.io.vn/tin-tuc/vong-tay-do',
    ).catch((caught) => caught)
    expect(error).toBeInstanceOf(GscClientError)
    expect(error).toMatchObject({
      code: 'GSC_INVALID_RESPONSE',
      retryable: false,
      configurationRequired: false,
      httpStatus: null,
    })
    expect(String(error)).not.toContain(responseSecret)
  })

  it('cancels a declared-oversized Search Analytics response without exposing it', async () => {
    const responseSecret = 'oversized-google-response-secret'
    const cancelBody = vi.fn()
    const responseBody = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(responseSecret))
      },
      cancel: cancelBody,
    })
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(responseBody, {
      status: 200,
      headers: {
        'content-length': String(1024 * 1024 + 1),
        'content-type': 'application/json',
      },
    }))
    const { client } = await createEnabledClient(fetchMock)

    const error = await client.querySearchAnalytics(B30_SEARCH_ANALYTICS_REQUEST)
      .catch((caught) => caught)
    expect(error).toBeInstanceOf(GscClientError)
    expect(error).toMatchObject({
      code: 'GSC_INVALID_RESPONSE',
      retryable: false,
      configurationRequired: false,
      httpStatus: null,
    })
    expect(String(error)).not.toContain(responseSecret)
    expect(cancelBody).toHaveBeenCalledOnce()
  })

  it('cancels a streamed-oversized Search Analytics response', async () => {
    const cancelBody = vi.fn()
    const responseBody = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(1024 * 1024))
        controller.enqueue(new Uint8Array(1))
      },
      cancel: cancelBody,
    })
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(responseBody, {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }))
    const { client } = await createEnabledClient(fetchMock)

    await expect(client.querySearchAnalytics(B30_SEARCH_ANALYTICS_REQUEST))
      .rejects.toMatchObject({
        code: 'GSC_INVALID_RESPONSE',
        retryable: false,
        configurationRequired: false,
        httpStatus: null,
      })
    expect(cancelBody).toHaveBeenCalledOnce()
  })

  it('allows a bounded provider response that completes after five seconds', async () => {
    vi.useFakeTimers()
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => (
      new Promise<Response>((resolve) => {
        setTimeout(() => {
          resolve(new Response(JSON.stringify({ sitemap: [] }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }))
        }, 7_500)
      })
    ))
    const { client } = await createEnabledClient(fetchMock)

    const outcome = client.listSitemaps().then(
      (value) => ({ value, error: null }),
      (error: unknown) => ({ value: null, error }),
    )
    await vi.advanceTimersByTimeAsync(7_499)
    expect(fetchMock).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(1)

    await expect(outcome).resolves.toEqual({ value: [], error: null })
  })

  it('times out Search Analytics after exactly fifteen seconds while auth is pending', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    const { client } = await createEnabledClient(fetchMock)
    googleAuthMocks.getRequestHeaders.mockReturnValueOnce(new Promise(() => undefined))
    vi.useFakeTimers()

    const outcome = client.querySearchAnalytics(B30_SEARCH_ANALYTICS_REQUEST)
      .catch((caught) => caught)
    await vi.advanceTimersByTimeAsync(14_999)
    expect(fetchMock).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    await expect(outcome).resolves.toBeInstanceOf(GscClientError)
    await expect(outcome).resolves.toMatchObject({
      code: 'GSC_REQUEST_TIMEOUT',
      retryable: true,
    })
  })

  it('maps an auth rejection at the exact Search Analytics deadline to timeout', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    const { client, credentialPath } = await createEnabledClient(fetchMock)
    vi.useFakeTimers()
    const startedAt = Date.now()
    const authSecret = `late-auth-secret-at-${credentialPath}`
    googleAuthMocks.getRequestHeaders.mockImplementationOnce(async () => {
      vi.setSystemTime(startedAt + 15_000)
      throw new Error(authSecret)
    })

    const error = await client.querySearchAnalytics(B30_SEARCH_ANALYTICS_REQUEST)
      .catch((caught) => caught)

    expect(error).toBeInstanceOf(GscClientError)
    expect(error).toMatchObject({
      code: 'GSC_REQUEST_TIMEOUT',
      retryable: true,
      configurationRequired: false,
      httpStatus: null,
    })
    expect(String(error)).not.toContain(authSecret)
    expect(String(error)).not.toContain(credentialPath)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('maps a fetch rejection at the exact Search Analytics deadline to timeout', async () => {
    const fetchSecret = 'https://private.invalid/?token=deadline-secret'
    let startedAt = 0
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => {
      vi.setSystemTime(startedAt + 15_000)
      throw new Error(fetchSecret)
    })
    const { client } = await createEnabledClient(fetchMock)
    vi.useFakeTimers()
    startedAt = Date.now()

    const error = await client.querySearchAnalytics(B30_SEARCH_ANALYTICS_REQUEST)
      .catch((caught) => caught)

    expect(error).toBeInstanceOf(GscClientError)
    expect(error).toMatchObject({
      code: 'GSC_REQUEST_TIMEOUT',
      retryable: true,
      configurationRequired: false,
      httpStatus: null,
    })
    expect(String(error)).not.toContain(fetchSecret)
  })

  it('times out when Search Analytics mapping succeeds exactly at the total deadline', async () => {
    let startedAt = 0
    let deliveredBody = false
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async () => {
      const responseBody = new ReadableStream<Uint8Array>({
        pull(controller) {
          deliveredBody = true
          vi.setSystemTime(startedAt + 15_000)
          controller.enqueue(new TextEncoder().encode(JSON.stringify({
            rows: [VALID_SEARCH_ANALYTICS_ROW],
          })))
          controller.close()
        },
      }, { highWaterMark: 0 })

      return new Response(responseBody, {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })
    const { client } = await createEnabledClient(fetchMock)
    vi.useFakeTimers()
    startedAt = Date.now()

    const error = await client.querySearchAnalytics(B30_SEARCH_ANALYTICS_REQUEST)
      .catch((caught) => caught)

    expect(deliveredBody).toBe(true)
    expect(error).toBeInstanceOf(GscClientError)
    expect(error).toMatchObject({
      code: 'GSC_REQUEST_TIMEOUT',
      retryable: true,
      configurationRequired: false,
      httpStatus: null,
    })
  })

  it('never starts Search Analytics when auth resolves after the total deadline', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    const { client } = await createEnabledClient(fetchMock)
    vi.useFakeTimers()
    googleAuthMocks.getRequestHeaders.mockImplementationOnce(() => (
      new Promise<Headers>((resolve) => {
        setTimeout(() => {
          resolve(new Headers({ authorization: 'Bearer late-token' }))
        }, 15_001)
      })
    ))

    const outcome = client.querySearchAnalytics(B30_SEARCH_ANALYTICS_REQUEST)
      .catch((caught) => caught)
    await vi.advanceTimersByTimeAsync(15_000)
    await expect(outcome).resolves.toMatchObject({
      code: 'GSC_REQUEST_TIMEOUT',
      retryable: true,
    })
    expect(fetchMock).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    await Promise.resolve()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('aborts a pending Search Analytics fetch at the fifteen-second total deadline', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation(async (_input, init) => (
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const error = new Error('fetch aborted')
          error.name = 'AbortError'
          reject(error)
        }, { once: true })
      })
    ))
    const { client } = await createEnabledClient(fetchMock)
    vi.useFakeTimers()

    const outcome = client.querySearchAnalytics(B30_SEARCH_ANALYTICS_REQUEST)
      .catch((caught) => caught)
    await vi.advanceTimersByTimeAsync(14_999)
    const signal = fetchMock.mock.calls[0]?.[1]?.signal
    expect(signal?.aborted).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(signal?.aborted).toBe(true)
    await expect(outcome).resolves.toBeInstanceOf(GscClientError)
    await expect(outcome).resolves.toMatchObject({
      code: 'GSC_REQUEST_TIMEOUT',
      retryable: true,
    })
  })
})
