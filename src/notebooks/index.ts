import { TypeRegistration } from 'src/types/notebooks'

export interface TypeLookup {
  [key: string]: TypeRegistration
}

export const PIPE_DEFINITIONS: TypeLookup = {}

export function register(definition: TypeRegistration) {
  if (PIPE_DEFINITIONS.hasOwnProperty(definition.type)) {
    throw new Error(
      `Pipe of type [${definition.type}] has already been registered`
    )
  }

  PIPE_DEFINITIONS[definition.type] = {
    ...definition,
  }
}

// NOTE: this loads in all the modules under the current directory
// to make it easier to add new types
const context = require.context('./pipes', true, /index\.(ts|tsx)$/)
context.keys().forEach(key => {
  context(key)
})
