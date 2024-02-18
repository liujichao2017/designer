// module.exports = {
//   apps: [{
//     name: "definer-live",
//     script: "npm",
//     instances: 1,
//     args: "start"
//   }]
// }

module.exports = {
  apps: [{
    name: "live",
    script: "src/app.js",
    instances: 2,
    exec_mode: "cluster"
  }]
}