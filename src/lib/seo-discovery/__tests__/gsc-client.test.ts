import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { GscClientError } from '@/lib/seo-discovery/gsc-client'
import { createGoogleSearchConsoleClient } from '@/lib/seo-discovery/google-gsc-client'

const googleAuthMocks = vi.hoisted(() => ({
  constructedWith: vi.fn(),
  getRequestHeaders: vi.fn(),
}))

const temporaryDirectories: string[] = []

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
    })
    const endpoint = 'https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Amushroomie.io.vn/sitemaps'
    expect(googleAuthMocks.getRequestHeaders).toHaveBeenCalledWith(endpoint)
    expect(fetchMock).toHaveBeenCalledWith(endpoint, expect.objectContaining({
      method: 'GET',
      redirect: 'error',
      signal: expect.any(AbortSignal),
    }))
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
    'maps HTTP %i to the typed, redacted %s error',
    async (status, code, retryable, configurationRequired) => {
      const responseSecret = `google-response-secret-${status}`
      const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(
        responseSecret,
        { status },
      ))
      const { client, credentialPath } = await createEnabledClient(fetchMock)

      const error = await client.listSitemaps().catch((caught) => caught)
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

  it('redacts authentication failures without making a request', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    const { client, credentialPath } = await createEnabledClient(fetchMock)
    googleAuthMocks.getRequestHeaders.mockRejectedValueOnce(new Error(
      `private key rejected at ${credentialPath}`,
    ))

    const error = await client.listSitemaps().catch((caught) => caught)
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

  it('redacts network failures as retryable typed errors', async () => {
    const networkSecret = 'https://private.invalid/?token=network-secret'
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(new Error(networkSecret))
    const { client } = await createEnabledClient(fetchMock)

    const error = await client.listSitemaps().catch((caught) => caught)
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

  it('rejects an oversized provider response without reading or exposing it', async () => {
    const responseSecret = 'oversized-google-response-secret'
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(responseSecret, {
      status: 200,
      headers: {
        'content-length': String(1024 * 1024 + 1),
        'content-type': 'application/json',
      },
    }))
    const { client } = await createEnabledClient(fetchMock)

    const error = await client.listSitemaps().catch((caught) => caught)
    expect(error).toBeInstanceOf(GscClientError)
    expect(error).toMatchObject({
      code: 'GSC_INVALID_RESPONSE',
      retryable: false,
      configurationRequired: false,
      httpStatus: null,
    })
    expect(String(error)).not.toContain(responseSecret)
  })

  it('times out the entire request after exactly five seconds while auth is pending', async () => {
    const fetchMock = vi.fn<typeof fetch>()
    const { client } = await createEnabledClient(fetchMock)
    googleAuthMocks.getRequestHeaders.mockReturnValueOnce(new Promise(() => undefined))
    vi.useFakeTimers()

    const outcome = client.listSitemaps().catch((caught) => caught)
    await vi.advanceTimersByTimeAsync(4_999)
    expect(fetchMock).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1)
    await expect(outcome).resolves.toBeInstanceOf(GscClientError)
    await expect(outcome).resolves.toMatchObject({
      code: 'GSC_REQUEST_TIMEOUT',
      retryable: true,
    })
  })

  it('aborts a pending fetch at the five-second total deadline', async () => {
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

    const outcome = client.listSitemaps().catch((caught) => caught)
    await vi.advanceTimersByTimeAsync(4_999)
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
