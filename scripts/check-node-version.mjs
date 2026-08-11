import path from 'node:path'
import { pathToFileURL } from 'node:url'

const MINIMUM_NODE_MAJOR = 22

/**
 * @param {string} version
 * @returns {boolean}
 */
export function isSupportedNodeVersion(version) {
  const match = /^v?(\d+)\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.exec(version.trim())
  return match !== null && Number(match[1]) >= MINIMUM_NODE_MAJOR
}

/**
 * @param {string} [version]
 * @returns {void}
 */
export function assertSupportedNodeVersion(version = process.versions.node) {
  if (!isSupportedNodeVersion(version)) {
    throw new Error(
      `Mushroomie requires Node.js >=${MINIMUM_NODE_MAJOR}; detected ${version}.`,
    )
  }
}

const invokedPath = process.argv[1]
const isDirectRun = invokedPath !== undefined
  && pathToFileURL(path.resolve(invokedPath)).href === import.meta.url

if (isDirectRun) {
  try {
    assertSupportedNodeVersion()
    console.log(
      `Node.js ${process.versions.node} satisfies Mushroomie runtime >=${MINIMUM_NODE_MAJOR}.`,
    )
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Unsupported Node.js runtime.')
    process.exitCode = 1
  }
}
