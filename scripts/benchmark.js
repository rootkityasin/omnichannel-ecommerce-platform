/* eslint-disable @typescript-eslint/no-require-imports */
const autocannon = require("autocannon");

const url = "http://localhost:3000";

console.log(`Running benchmark on ${url}...`);

const instance = autocannon(
  {
    url,
    connections: 10,
    pipelining: 1,
    duration: 10,
  },
  (err, result) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(autocannon.printResult(result));
  },
);

autocannon.track(instance, { renderProgressBar: true });
