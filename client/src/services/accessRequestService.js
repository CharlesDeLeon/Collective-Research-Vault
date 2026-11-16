export async function submitAccessRequest(paperId, payload) {
  await new Promise((resolve) => setTimeout(resolve, 700))
  return { paperId, ...payload }
}