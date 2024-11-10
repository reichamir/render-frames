import { Plugin } from "vite";

type PluginOptions = {
  coop: string;
  coep: string;
};

const assertPluginOptions = (
  pluginOptions: Partial<PluginOptions>
): PluginOptions => {
  const { coep = "require-corp", coop = "same-origin" } = pluginOptions;
  return {
    coep,
    coop,
  };
};

export const pluginCORPHeaders = (
  userOptions: Partial<PluginOptions> = {}
): Plugin => {
  const opts = assertPluginOptions(userOptions);

  return {
    name: "vite-plugin-corp-headers",
    configureServer: async (server) => {
      server.middlewares.use((_req, res, next) => {
        res.setHeader("Cross-Origin-Embedder-Policy", opts.coep);
        res.setHeader("Cross-Origin-Opener-Policy", opts.coop);
        next();
      });
    },
  };
};

export default pluginCORPHeaders;
