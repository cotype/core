import {
  ExternalDataSource,
  ExternalDataSourceHelper,
  Converter as ConverterI,
  ConverterInstructions,
  CONVERTER_SPREAD_INSTRUCTION,
  BaseUrls
} from "../typings";
import formatQuillDelta from "./content/formatQuillDelta";
import url from "url";

export type ExternalDataSourceWithOptionalHelper =
  | ExternalDataSource
  | ((helper: ExternalDataSourceHelper) => ExternalDataSource);

type Opts = {
  baseUrls: Partial<BaseUrls>;
};

type GenericDict = { [key: string]: any };

const SPREAD: CONVERTER_SPREAD_INSTRUCTION = "$$CONVERTER_SPREAD";

function convert<From, To>(
  inputs: From,
  passThrough: Array<keyof From>,
  instructions: ConverterInstructions<From, To>
) {
  return Object.keys(instructions).reduce(
    async (memo: Promise<GenericDict>, key) => {
      const [resolvedMemo, value] = await Promise.all([
        memo,
        (instructions as GenericDict)[key as string](inputs)
      ]);

      if (key === SPREAD) {
        return {
          ...resolvedMemo,
          ...value
        } as To;
      }

      return {
        ...resolvedMemo,
        [key]: value
      } as To;
    },
    Promise.resolve(
      passThrough.reduce(
        (memo: GenericDict, key) => {
          memo[key as string] = (inputs as GenericDict)[key as string];

          return memo as To;
        },
        {} as GenericDict
      )
    )
  ) as Promise<To>;
}

class Converter<ApiDataSet, HubDataSet>
  implements ConverterI<ApiDataSet, HubDataSet> {
  static SPREAD = SPREAD;
  private passThroughKeys: Array<keyof ApiDataSet>;
  private toHubInstructions: ConverterInstructions<ApiDataSet, HubDataSet>;
  private fromHubInstructions: ConverterInstructions<HubDataSet, ApiDataSet>;

  constructor(
    passThrough: Array<keyof ApiDataSet>,
    toHub: ConverterInstructions<ApiDataSet, HubDataSet> = {},
    fromHub: ConverterInstructions<HubDataSet, ApiDataSet> = {}
  ) {
    this.passThroughKeys = passThrough;
    this.toHubInstructions = toHub;
    this.fromHubInstructions = fromHub;
    this.toHub = this.toHub.bind(this);
    this.fromHub = this.fromHub.bind(this);
  }
  toHub(input: ApiDataSet): Promise<HubDataSet> {
    return convert<ApiDataSet, HubDataSet>(
      input,
      this.passThroughKeys,
      this.toHubInstructions
    );
  }
  fromHub(input: HubDataSet): Promise<ApiDataSet> {
    return convert<HubDataSet, ApiDataSet>(
      input,
      (this.passThroughKeys as unknown) as Array<keyof HubDataSet>,
      this.fromHubInstructions
    );
  }
}

function buildHelper(opts: Opts): ExternalDataSourceHelper {
  const staticUrl = (opts.baseUrls || {}).media || "";
  return {
    richtextToHtml(delta) {
      return formatQuillDelta(delta, "html");
    },
    Converter,
    media: {
      original(image: string) {
        if (image.match(/^http/)) {
          return image;
        }

        return url.resolve(staticUrl, `./${image}`);
      },
      fromOriginal(image: string) {
        return image.replace(new RegExp(`^${staticUrl}`), "");
      }
    }
  };
}

export function provide(
  externalDataSources: ExternalDataSourceWithOptionalHelper[] = [],
  opts: Opts
) {
  const helper = buildHelper(opts);
  return externalDataSources.map(externalDataSource => {
    if (typeof externalDataSource === "function") {
      return externalDataSource(helper);
    }

    return externalDataSource;
  });
}
