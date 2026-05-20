/** Normalizes backend error payloads (AppError uses `message`, legacy uses `error`) */
export function getApiErrorMessage(err, fallback = "Something went wrong") {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    fallback
  );
}
