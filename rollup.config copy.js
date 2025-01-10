import resolve from "@rollup/plugin-node-resolve";
// import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
/**@type @type {import("rollup").RollupOptions[]} */
export default [
  {
    input: "src/index.ts",
    output: [
      {
        // file: "dist/index.js",
        format: "cjs",
        preserveModules: true,
        preserveModulesRoot: "src",
        sourcemap: true,
        dir: "dist",
      },
      {
        // file: "dist/index.esm.js",
        format: "esm",
        preserveModules: true,
        preserveModulesRoot: "src",
        sourcemap: true,
        dir: "dist",
      },
    ],
    plugins: [
      peerDepsExternal({
        includeDependencies: true,
      }),
      resolve({ extensions: [".js", ".ts", ".jsx", ".tsx"] }), // 用于解析模块
      // commonjs(), // 用于转换 CommonJS 模块为 ES6 模块
      typescript({
        tsconfig: "./tsconfig.types.json",
        declaration: true,
      }),
      // terser({
      //   compress: true, // 启用压缩
      //   mangle: true, // 启用混淆
      // }),
    ],
    external: ["react", "antd", "@emotion/react"],
  },
];
