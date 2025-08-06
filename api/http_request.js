const fetch = require("node-fetch");
module.exports = async (req, res) => {
  const { method, url, headers = {}, params = {}, data } = req.body;
  const qs = Object.keys(params).length
    ? "?" + new URLSearchParams(params).toString()
    : "";
  const response = await fetch(url + qs, {
    method,
    headers,
    body:
      method === "POST" && data
        ? (typeof data === "string" ? data : JSON.stringify(data))
        : undefined,
  });
  const text = await response.text();
  res.status(200).send(text);
};
