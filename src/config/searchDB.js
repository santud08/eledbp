import { Client } from "@elastic/elasticsearch";
import { envs } from "./index.js";

/**
 * searchClient
 * for search engines
 * elastic search use
 * @param req
 * @param res
 */
const searchClient = new Client({
  node: `${envs.SEARCH_DB.ES_HOST}:${envs.SEARCH_DB.ES_PORT}`,
  auth: {
    username: envs.SEARCH_DB.ES_USER,
    password: envs.SEARCH_DB.ES_PASSWORD,
    auth: { apiKey: envs.apiKey },
  },
  tls: {
    // might be required if it's a self-signed certificate
    rejectUnauthorized: false,
  },
});

let isSearchClient = false;
const checkElasticsearchConnection = async () => {
  try {
    // Send a ping request to Elasticsearch
    //const response = await searchClient.ping();
    const response = await searchClient.cluster.health();
    // If Elasticsearch responds with status 200, the connection is successful
    if (response) {
      isSearchClient = true;
      console.log("Elasticsearch cluster is up and running.");
    } else {
      console.log("Unexpected response from Elasticsearch:", response);
    }
  } catch (error) {
    console.error("Error connecting to Elasticsearch:", error);
  }
};
checkElasticsearchConnection();
export { searchClient, isSearchClient };
