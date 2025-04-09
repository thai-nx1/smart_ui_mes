declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | [number, number, number, number];
    filename?: string;
    image?: {
      type?: string;
      quality?: number;
    };
    html2canvas?: {
      scale?: number;
      [key: string]: any;
    };
    jsPDF?: {
      unit?: string;
      format?: string;
      orientation?: 'portrait' | 'landscape';
      [key: string]: any;
    };
    [key: string]: any;
  }

  interface Html2PdfInstance {
    from(element: HTMLElement | Element): Html2PdfInstance;
    set(options: Html2PdfOptions): Html2PdfInstance;
    save(): Promise<void>;
    outputPdf(): any;
    outputImg(): any;
  }

  function html2pdf(): Html2PdfInstance;
  function html2pdf(element: HTMLElement | Element, options?: Html2PdfOptions): Promise<void>;

  export default html2pdf;
}