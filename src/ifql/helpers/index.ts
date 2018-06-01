import uuid from 'uuid'

import Walker from 'src/ifql/ast/walker'
import {funcNames} from 'src/ifql/constants'
import {getDeep} from 'src/utils/wrappers'

import {FlatBody, Func, Suggestion} from 'src/types/ifql'

interface Body extends FlatBody {
  id: string
}

export const bodyNodes = (ast, suggestions: Suggestion[]): Body[] => {
  if (!ast) {
    return []
  }

  const walker = new Walker(ast)

  const body = walker.body.map(b => {
    const {type} = b
    const id = uuid.v4()
    if (type.includes('Variable')) {
      const declarations = b.declarations.map(d => {
        if (!d.funcs) {
          return {...d, id: uuid.v4()}
        }

        return {
          ...d,
          id: uuid.v4(),
          funcs: functions(d.funcs, suggestions),
        }
      })

      return {...b, type, id, declarations}
    }

    const {funcs, source} = b

    return {
      id,
      funcs: functions(funcs, suggestions),
      declarations: [],
      type,
      source,
    }
  })

  return body
}

const functions = (funcs: Func[], suggestions: Suggestion[]): Func[] => {
  const funcList = funcs.map(func => {
    const suggestion = suggestions.find(f => f.name === func.name)
    if (!suggestion) {
      return {
        id: uuid.v4(),
        source: func.source,
        name: func.name,
        args: func.args,
      }
    }

    const {params, name} = suggestion
    const args = Object.entries(params).map(([key, type]) => {
      const argWithKey = func.args.find(arg => arg.key === key)
      const value = getDeep<string>(argWithKey, 'value', '')

      return {
        key,
        value,
        type,
      }
    })

    return {
      id: uuid.v4(),
      source: func.source,
      name,
      args,
    }
  })

  return funcList
}
