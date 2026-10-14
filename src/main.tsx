import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NebulaAgency from "./NebulaAgency";
import WorksGallery from "./WorksGallery";
import ContactPage from "./ContactPage";
import ExperiencePage from "./ExperiencePage";
import SeoHead from "./seo/SeoHead";
import { LocaleProvider } from "./i18n/LocaleContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <LocaleProvider>
        <SeoHead />
        <Routes>
          <Route path="/" element={<NebulaAgency />} />
          <Route path="/works" element={<WorksGallery />} />
          <Route path="/experience" element={<ExperiencePage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
      </LocaleProvider>
    </BrowserRouter>
  </StrictMode>,
);
