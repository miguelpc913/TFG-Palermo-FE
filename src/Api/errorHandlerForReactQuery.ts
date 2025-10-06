export const errorHandlerForReactQuery = (e: unknown) => {
  if (typeof e === "string") {
    throw new Error(e.toUpperCase());
  } else if (e instanceof Error) {
    const errorString = e.toString();
    if (errorString) {
      throw new Error(errorString);
    } else {
      throw new Error("There has been an error in the request.");
    }
  }
};
