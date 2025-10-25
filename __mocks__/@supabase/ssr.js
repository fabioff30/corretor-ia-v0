module.exports = {
  createBrowserClient: () => ({
    from: () => ({ select: () => ({}) }),
  }),
  createServerClient: () => ({
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }) }) }),
    }),
  }),
}
