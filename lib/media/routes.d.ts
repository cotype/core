/**
 * Media routes (/api/media/*)
 */
import { Router } from "express";
import { Persistence } from "../persistence";
import Storage from "./storage/Storage";
export default function routes(router: Router, persistence: Persistence, storage: Storage): void;
