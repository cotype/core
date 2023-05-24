/**
 * Helper to provide sensible defaults for model properties
 * that can be deduced from other props or the context.
 */
import * as Cotype from "../../typings";
export default function modelBuilder(props: Cotype.ModelBuilderOpts, externalDataSources?: Cotype.ExternalDataSource[]): (defs: Cotype.ModelOpts[]) => Cotype.Model[];
