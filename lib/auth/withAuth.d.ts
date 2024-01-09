import { DataSource } from "../../typings";
type GenericMap = {
    [key: string]: any;
};
export default function withAuth(dataSource: GenericMap): DataSource;
export {};
