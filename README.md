# YNetwork
A simple wrapper around axios to simplify making requests and retrieving data.

## What YNetwork provides
- `async/await`
- does not throw erros. You always have the response in result and must check for errors yourself. This simplifies some things on frontend. (Opinionated)
- Simpler access to response attributes. `const { status, result, headers } = await YNetwork.xxx()`
- Global `headers` that is spread in every request. `YNetwork.headers.xxx = ''`
- Local headers for every request. `YNetwork.xxx(url, payload, headers)`

YNetwork introduces two concpts which could have been done with axios too but have been made simpler (kind of).

## Short Circuit
You can apply multiple short circuits on YNetwork and conditionally and if you return something, that will be used as the result of that request.

## Preprocess
You can apply multiple pre processors on the response. Pre processors can change the response or dismiss a response completely.