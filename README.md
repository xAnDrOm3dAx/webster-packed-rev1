# Webster Pack Helper

A guided packing session for a Webster pack (weekly medication tray). See [SPEC.md](./SPEC.md) for the full build spec.

Requires Node 20.19+ or 22.12+.

```bash
npm install
npm run dev     # start the dev server
npm run test    # run the test suite
npm run build   # type-check and build for production
```

All persistence goes through `src/storage/repository.ts` — no other module touches `localStorage` directly.
