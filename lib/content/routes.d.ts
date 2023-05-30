/// <reference types="request" />
import { Router } from "express";
import { Persistence } from "../persistence";
import { Models, ExternalDataSource } from "../../typings";
type Opts = {
    persistence: Persistence;
    models: Models;
    externalDataSources: ExternalDataSource[];
};
declare const _default: (router: Router, { persistence, models, externalDataSources }: Opts) => void;
export default _default;
