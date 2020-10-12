import React, { useState } from "react";
import { Model, NavigationItem } from "../../../typings";
import { Redirect, RouteComponentProps } from "react-router";
import { parse } from "qs";
import pathMatch from "path-match";
import basePath from "../basePath";
import useAsyncEffect from "use-async-effect";
import api from "../api";
const createRoute = pathMatch({
  sensitive: false,
  strict: false,
  end: false
});

export type Props = RouteComponentProps & {
  contentModels: Model[];
  navigation?: NavigationItem[];
};
const getURLLength = (p: string | { [s: string]: string }) => {
  if (typeof p === "string") {
    return (p.match(/\//g) || []).length;
  } else {
    return Object.values(p)
      .map(s => (s.match(/\//g) || []).length)
      .sort((a, b) => b - a)[0];
  }
};
const findPathInNavigation = (model: Model) => (
  found: string,
  navigationItem: NavigationItem
): string => {
  if (found) {
    return found;
  }
  if ("items" in navigationItem) {
    return navigationItem.items.reduce(findPathInNavigation(model), "");
  }
  if (navigationItem.model === model.name) {
    return navigationItem.path;
  }
  return "";
};

const EditURLRedirect: React.FC<Props> = ({
  contentModels,
  navigation,
  ...props
}) => {
  const [redirect, setRedirect] = useState<string | false | undefined>(
    undefined
  );
  useAsyncEffect(async () => {
    const query = props.location.search.replace("?", "");
    const parsed = parse(query) as { q: string };
    if (parsed.q && navigation) {
      let foundModels = contentModels.filter(model => {
        if (!model.urlPath) {
          return false;
        }
        const urlPathArray =
          typeof model.urlPath === "object"
            ? Object.values(model.urlPath)
            : [model.urlPath];
        if (urlPathArray.includes(parsed.q)) {
          return true;
        }
        return urlPathArray.some(s => {
          const matcher = createRoute(s);
          const match = matcher(parsed.q);
          return !!match;
        });
      });

      if (foundModels.length > 0) {
        foundModels = foundModels.sort((a, b) => {
          if (!a.urlPath) {
            return 1;
          }
          if (!b.urlPath) {
            return -1;
          }
          const deepnesA = getURLLength(a.urlPath);
          const deepnesB = getURLLength(b.urlPath);
          if (deepnesA < deepnesB) return 1;
          if (deepnesA > deepnesB) return -1;
          return 0;
        });
        let path = navigation.reduce<string>(
          findPathInNavigation(foundModels[0]),
          ""
        );
        if (path && foundModels[0] && foundModels[0].urlPath) {
          const urlPathArray: string[] =
            typeof foundModels[0].urlPath === "object"
              ? Object.values(foundModels[0].urlPath)
              : [foundModels[0].urlPath];
          const m = urlPathArray
            .map(s => {
              const matcher = createRoute(s);
              const match = matcher(parsed.q);
              if (match) {
                return match;
              }
            })
            .filter(Boolean);

          const fetchQuery = Object.entries(m[0]).reduce(
            (acc, [key, value]) => ({ ...acc, ["data." + key]: { eq: value } }),
            {}
          );
          const fetchedId = await api.list(
            foundModels[0],
            {
              offset: 0,
              limit: 1
            },
            fetchQuery
          );
          if (fetchedId.items.length > 0) {
            path = path + "/edit/" + fetchedId.items[0].id;
          }
        }
        if (path) {
          return setRedirect(path);
        }
      }
    }
    return setRedirect(false);
  }, [props.location.search]);

  if (redirect === false) {
    return <>Model not found</>;
  }
  if (redirect) {
    return <Redirect to={basePath + redirect} />;
  }

  return <>Loading</>;
};
export default EditURLRedirect;
