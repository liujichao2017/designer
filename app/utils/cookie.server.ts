import { createCookie } from "@remix-run/node"; // or cloudflare/deno

export const language = createCookie("language", {
  path: '/',
  sameSite: 'lax',
});

export const token = createCookie("token", {
  path: "/",
  sameSite: "lax"
})