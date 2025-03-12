import cron from "node-cron";
import InactivityCheckService from "../services/Inactivity/InactivityCheckService";

cron.schedule("*/3 * * * *", () => {
  console.log("Iniciando verificação de inatividade...");
  InactivityCheckService.execute()
    .then(() => console.log("Verificação concluída"))
    .catch(console.error);
});