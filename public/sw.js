/*
 * @Author: mario mario0723@163.com
 * @Date: 2025-05-25 13:08:37
 * @LastEditors: mario mario0723@163.com
 * @LastEditTime: 2025-05-25 13:19:02
 * @FilePath: /shuati/public/sw.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open("my-cache").then(function (cache) {
      return cache.addAll(["/", "/index.html"]).catch(function (error) {
        console.log("资源缓存失败:", error);
      });
    })
  );
});

self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then(function (response) {
      // 缓存中有对应的资源，直接返回
      if (response) {
        return response;
      } // 缓存中没有对应的资源，从网络获取

      return fetch(event.request);
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(self.clients.claim());
});
