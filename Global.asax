<%@ Application Language="C#" %>

<script runat="server">
	protected void Application_PreRequestHandlerExecute(Object sender, EventArgs e)
	{
		Response.Cache.SetCacheability(HttpCacheability.Private);
		Response.Cache.SetNoStore();
	}
</script>