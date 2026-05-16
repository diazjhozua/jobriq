import Conf from 'conf'

interface StoreSchema {
  openaiKey: string
}

const store = new Conf<StoreSchema>({
  projectName: 'jobriq',
  encryptionKey: 'jobriq-key-encryption',
})

export function getApiKey(): string | undefined {
  return store.get('openaiKey') as string | undefined
}

export function setApiKey(key: string): void {
  store.set('openaiKey', key)
}

export function hasApiKey(): boolean {
  const key = getApiKey()
  return typeof key === 'string' && key.startsWith('sk-')
}

export function requireApiKey(): string {
  const key = getApiKey()
  if (!key || !key.startsWith('sk-')) {
    throw new Error('OpenAI API key not configured. Run: jobriq config')
  }
  return key
}
