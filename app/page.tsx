'use client';

import dynamic from "next/dynamic";

import CanvasLoader from "./components/common/CanvasLoader";
import ScrollWrapper from "./components/common/ScrollWrapper";
import Experience from "./components/experience";
import Footer from "./components/footer";
import Hero from "./components/hero";
import { useDemoStore } from "@stores";

// Loaded only when the demo is opened, so the 3D site's initial bundle is untouched.
const WhisperFlowDemo = dynamic(() => import("./components/demo/WhisperFlowDemo"), { ssr: false });

const DemoMount = () => {
  const isDemoOpen = useDemoStore((state) => state.isDemoOpen);
  return isDemoOpen ? <WhisperFlowDemo /> : null;
};

const Home = () => {
  return (
    <>
      <CanvasLoader>
        <ScrollWrapper>
          <Hero/>
          <Experience/>
          <Footer/>
        </ScrollWrapper>
      </CanvasLoader>
      <DemoMount />
    </>
  );
};
export default Home;
