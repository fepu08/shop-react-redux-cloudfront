import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { AppConfigurationClient } from "@azure/app-configuration";

// Create an App Config Client to interact with the service
//const connection_string = process.env.AZURE_APP_CONFIG_CONNECTION_STRING;
//const client = new AppConfigurationClient(connection_string);

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
): Promise<void> {
  // Retrieve a configuration key
  //    const configs = await client.getConfigurationSetting({
  //        key: 'DATA_FROM_APP_CONFIG',
  //    });

  context.log("HTTP trigger function processed a request.");
  const name = req.query.name || (req.body && req.body.name);
  const responseMessage = name
    ? "Hello, " + name + ". This HTTP triggered function executed successfully."
    : "This HTTP triggered function executed successfully. Pass a name in the query string or in the request body for a personalized response.";

  context.res = {
    // status: 200, /* Defaults to 200 */
    body: responseMessage,
  };
};

export default httpTrigger;
