import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/sidebar-fix.css"; // Import CSS fix cho sidebar
import "./lib/i18n"; // Import i18next để sử dụng đa ngôn ngữ
import { setupInitialTheme } from "./lib/theme"; // Import theme initialization
import { registerServiceWorker } from "./pwa"; // Import service worker registration

// Khởi tạo theme từ theme.json
setupInitialTheme();

// Khởi tạo ứng dụng
createRoot(document.getElementById("root")!).render(<App />);

// Đăng ký service worker cho PWA
registerServiceWorker();
