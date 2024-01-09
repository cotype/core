/// <reference types="request" />
import { Model, ExternalDataSource, ResponseHeaders } from "../../../typings";
import { Router } from "express";
import { Persistence } from "../../persistence";
export default function routes(router: Router, persistence: Persistence, models: Model[], externalDataSources: ExternalDataSource[], mediaUrl: string, responseHeaders?: ResponseHeaders): void;
