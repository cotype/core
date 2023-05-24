import { Models, ExternalDataSource } from "../../../typings";
import { Router } from "express";
import { Persistence } from "../../persistence";
type Opts = {
    persistence: Persistence;
    models: Models;
    externalDataSources: ExternalDataSource[];
};
export default function graphql(router: Router, { persistence, models }: Opts): void;
export {};
