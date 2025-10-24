import readline from "readline";
import { generateAuthUrl, getRefreshToken } from "./gmail_utils";

async function main() {
  const url = generateAuthUrl();
  console.log("\nVisit the above URL and authorize the app.");

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const code = await new Promise<string>(resolve => rl.question("\nEnter the code here: ", resolve));
  rl.close();

  const tokens = await getRefreshToken(code);
  console.log("\n✅ Save this refresh token in your .env:\n");
  console.log("GOOGLE_REFRESH_TOKEN=" + tokens.refresh_token);
}

main();
