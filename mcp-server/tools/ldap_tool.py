import os
from fastmcp import FastMCP

def register_ldap_tools(mcp: FastMCP, demo_mode: bool, load_mock):

    @mcp.tool()
    async def ldap_user_lookup(username: str) -> dict:
        """Look up an Active Directory user: SAM account, UPN, OU path, groups, MFA status, manager, account status."""
        if demo_mode:
            return load_mock(f"ldap_user_{username}.json")
        try:
            from ldap3 import Server, Connection, ALL
            server = Server(os.getenv("LDAP_HOST", "ldap://localhost"), get_info=ALL)
            conn = Connection(
                server,
                user=os.getenv("LDAP_BIND_DN", ""),
                password=os.getenv("LDAP_BIND_PASSWORD", ""),
                auto_bind=True,
            )
            conn.search(
                search_base=os.getenv("LDAP_BASE_DN", "dc=corp,dc=local"),
                search_filter=f"(sAMAccountName={username})",
                attributes=["cn", "mail", "memberOf", "manager", "distinguishedName", "userAccountControl"],
            )
            if conn.entries:
                entry = conn.entries[0]
                return {
                    "username": username,
                    "display_name": str(entry.cn),
                    "email": str(entry.mail),
                    "groups": [str(g) for g in entry.memberOf],
                    "manager": str(entry.manager),
                    "dn": str(entry.distinguishedName),
                    "account_enabled": not bool(int(str(entry.userAccountControl)) & 2),
                }
            return {"error": f"User {username} not found in LDAP"}
        except Exception as e:
            return {"error": str(e), "username": username}
