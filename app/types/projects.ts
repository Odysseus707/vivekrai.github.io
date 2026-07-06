interface ProjectUrl {
  text: string;
  url: string;
}

export interface Project {
  title: string;
  date: string;
  subtext: string;
  url?: string;
  urls?: ProjectUrl[];
  /** Shows a TRY NOW button that opens the in-browser live demo overlay. */
  demo?: boolean;
}