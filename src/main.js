/* =====================================================================
   Application bootstrap.
   Order of work:
     1. Static map data is already loaded (the static-data import below waits for it).
     2. Read the cleaned data files through the contract loader (real data, or
        a test fixture folder in test mode). A failed load still starts the app,
        with each file in an honest missing/invalid/error state.
     3. Give the TB and prediction results to their models.
     4. Build the AppController, which wires models, views and controllers.
   ===================================================================== */
import "./models/static-data-model.js";
import { ContractLoader, ContractData, CONTRACT } from "./services/contract-loader.js";
import { TbData, PredData } from "./models/tb-data-model.js";
import { DataModelView } from "./views/data-model-view.js";
import { AppController } from "./controllers/app-controller.js";
/* Side-effect import: adds the TB Screening Facilities layer methods to MapView and PlaceDetailsView. */
import "./views/facilities-view.js";

async function start() {
  try { Object.assign(ContractData, await ContractLoader.loadAll()); }
  catch (e) { ContractData.tb = { file: CONTRACT.tb.file, state: "error", message: "Loading failed: " + e.message }; }
  TbData.setData(ContractData.tb);
  PredData.setData(ContractData.pred);
  DataModelView.renderBanner();
  const app = new AppController();
  /* A handle for debugging in the browser console and for the automated browser tests.
     Nothing in the app reads it. */
  window.tbApp = app;
  app.start();
}

/* Module scripts run after the document is parsed, so the DOM is ready here. */
await start();
