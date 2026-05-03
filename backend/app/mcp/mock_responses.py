"""Demo-mode mock responses for MCP tool calls, keyed by IOC value."""

# ---------------------------------------------------------------------------
# VirusTotal — IP reports
# ---------------------------------------------------------------------------

_VT_IP_185 = {
    "data": {
        "id": "185.220.101.47",
        "type": "ip_address",
        "attributes": {
            "as_owner": "Hetzner Online GmbH",
            "asn": 24940,
            "country": "DE",
            "network": "185.220.101.0/24",
            "reputation": -62,
            "last_analysis_stats": {
                "malicious": 14,
                "suspicious": 2,
                "undetected": 63,
                "harmless": 7,
                "timeout": 0,
            },
            "last_analysis_date": 1746700000,
            "tags": ["tor-exit-node", "scanner"],
            "total_votes": {"harmless": 2, "malicious": 41},
            "crowdsourced_context": [
                {
                    "detail": "Known Tor exit node — frequently used for anonymised malicious traffic.",
                    "source": "Proofpoint ET",
                    "timestamp": 1746680000,
                    "severity": "high",
                }
            ],
        },
    }
}

_VT_IP_203 = {
    "data": {
        "id": "203.0.113.200",
        "type": "ip_address",
        "attributes": {
            "as_owner": "China Telecom",
            "asn": 4134,
            "country": "CN",
            "network": "203.0.113.0/24",
            "reputation": -28,
            "last_analysis_stats": {
                "malicious": 8,
                "suspicious": 2,
                "undetected": 61,
                "harmless": 5,
                "timeout": 0,
            },
            "last_analysis_date": 1746700000,
            "tags": ["ddos-source", "scanner"],
            "total_votes": {"harmless": 3, "malicious": 18},
            "crowdsourced_context": [
                {
                    "detail": "Associated with volumetric UDP DDoS attacks targeting European infrastructure.",
                    "source": "Emerging Threats",
                    "timestamp": 1746500000,
                    "severity": "medium",
                }
            ],
        },
    }
}

_VT_IP_45 = {
    "data": {
        "id": "45.142.212.100",
        "type": "ip_address",
        "attributes": {
            "as_owner": "Frantech Solutions",
            "asn": 53667,
            "country": "NL",
            "network": "45.142.212.0/24",
            "reputation": -44,
            "last_analysis_stats": {
                "malicious": 11,
                "suspicious": 3,
                "undetected": 58,
                "harmless": 4,
                "timeout": 0,
            },
            "last_analysis_date": 1746700000,
            "tags": ["c2", "cobalt-strike", "bulletproof-hosting"],
            "total_votes": {"harmless": 1, "malicious": 27},
            "crowdsourced_context": [
                {
                    "detail": "Cobalt Strike team server — beacon traffic observed on port 443/80.",
                    "source": "Abuse.ch ThreatFox",
                    "timestamp": 1746690000,
                    "severity": "high",
                },
                {
                    "detail": "Hosting provider known for ignoring abuse reports (bulletproof).",
                    "source": "Spamhaus DROP",
                    "timestamp": 1746600000,
                    "severity": "medium",
                },
            ],
        },
    }
}

# ---------------------------------------------------------------------------
# VirusTotal — Domain reports
# ---------------------------------------------------------------------------

_VT_DOMAIN_CORP_MAIL = {
    "data": {
        "id": "corp-mail-auth.ru",
        "type": "domain",
        "attributes": {
            "registrar": "NameCheap, Inc.",
            "creation_date": 1700000000,
            "last_update_date": 1746000000,
            "reputation": -48,
            "last_analysis_stats": {
                "malicious": 18,
                "suspicious": 3,
                "undetected": 45,
                "harmless": 5,
                "timeout": 0,
            },
            "last_analysis_date": 1746700000,
            "tags": ["phishing", "evilproxy", "malware-distribution"],
            "total_votes": {"harmless": 1, "malicious": 29},
            "categories": {
                "Forcepoint ThreatSeeker": "phishing",
                "Sophos": "malware sites",
                "Webroot": "phishing and other frauds",
            },
            "popular_threat_classification": {
                "suggested_threat_label": "phishing/credential-harvesting",
                "popular_threat_category": [
                    {"count": 14, "value": "phishing"},
                    {"count": 7, "value": "trojan-downloader"},
                ],
            },
        },
    }
}

# ---------------------------------------------------------------------------
# VirusTotal — File / hash reports
# ---------------------------------------------------------------------------

_VT_HASH_WANNACRY = {
    "data": {
        "id": "24d004a104d4d54034dbcffc2a4b19a11f39008a575aa614ea04703480b1022c",
        "type": "file",
        "attributes": {
            "meaningful_name": "lhdfrgui.exe",
            "sha256": "24d004a104d4d54034dbcffc2a4b19a11f39008a575aa614ea04703480b1022c",
            "md5": "db349b97c37d22f5ea1d1841e3c89eb4",
            "type_description": "Win32 EXE",
            "type_tag": "peexe",
            "size": 3723264,
            "magic": "PE32 executable (GUI) Intel 80386, for MS Windows",
            "reputation": -1795,
            "times_submitted": 2059,
            "last_analysis_stats": {
                "malicious": 67,
                "suspicious": 0,
                "undetected": 2,
                "harmless": 0,
                "timeout": 1,
                "failure": 0,
                "type-unsupported": 4,
            },
            "last_analysis_date": 1746700000,
            "tags": [
                "cve-2017-0147",
                "cve-2017-0144",
                "malware",
                "exploit",
                "peexe",
                "detect-debug-environment",
                "checks-network-adapters",
                "runtime-modules",
            ],
            "total_votes": {"harmless": 18, "malicious": 163},
            "popular_threat_classification": {
                "suggested_threat_label": "trojan.wannacry/wanna",
                "popular_threat_category": [
                    {"count": 29, "value": "trojan"},
                    {"count": 23, "value": "ransomware"},
                ],
                "popular_threat_name": [
                    {"count": 12, "value": "wannacry"},
                    {"count": 8, "value": "wanna"},
                ],
            },
            "sandbox_verdicts": {
                "C2AE": {
                    "category": "malicious",
                    "confidence": 70,
                    "sandbox_name": "C2AE",
                    "malware_classification": ["RANSOM"],
                    "malware_names": ["WannaCry", "WannaCry_KillSwitch"],
                },
                "Zenbox": {
                    "category": "malicious",
                    "malware_classification": ["MALWARE", "RANSOM"],
                    "sandbox_name": "Zenbox",
                    "malware_names": ["Wannacry"],
                    "confidence": 72,
                },
            },
            "crowdsourced_ids_results": [
                {
                    "rule_category": "A Network Trojan was detected",
                    "alert_severity": "high",
                    "rule_msg": "ET MALWARE Possible WannaCry DNS Lookup 1",
                    "rule_id": "1:2024291",
                    "rule_source": "Proofpoint Emerging Threats Open",
                },
                {
                    "rule_category": "A Network Trojan was detected",
                    "alert_severity": "high",
                    "rule_msg": "ET MALWARE W32/WannaCry.Ransomware Killswitch Domain HTTP Request 1",
                    "rule_id": "1:2024298",
                    "rule_source": "Proofpoint Emerging Threats Open",
                },
            ],
        },
    }
}

_VT_HASH_MIMIKATZ = {
    "data": {
        "id": "a3f1c9b2e847d6f0391cc52a4e1b7f3d",
        "type": "file",
        "attributes": {
            "meaningful_name": "mimikatz.exe",
            "sha256": "a3f1c9b2e847d6f0391cc52a4e1b7f3d8c2a5e690f14b73d21cc84a0f95e6271",
            "md5": "a3f1c9b2e847d6f0391cc52a4e1b7f3d",
            "type_description": "Win32 EXE",
            "type_tag": "peexe",
            "size": 1257472,
            "magic": "PE32 executable (console) Intel 80386, for MS Windows",
            "reputation": -1420,
            "times_submitted": 4812,
            "last_analysis_stats": {
                "malicious": 57,
                "suspicious": 2,
                "undetected": 9,
                "harmless": 0,
                "timeout": 0,
                "failure": 0,
                "type-unsupported": 2,
            },
            "last_analysis_date": 1746700000,
            "tags": [
                "peexe",
                "credential-dumping",
                "lsass",
                "pass-the-hash",
                "kerberoasting",
            ],
            "total_votes": {"harmless": 4, "malicious": 209},
            "popular_threat_classification": {
                "suggested_threat_label": "hacktool.mimikatz/kerberoast",
                "popular_threat_category": [
                    {"count": 38, "value": "hacktool"},
                    {"count": 14, "value": "credential-stealer"},
                ],
                "popular_threat_name": [
                    {"count": 22, "value": "mimikatz"},
                    {"count": 9, "value": "kerberoast"},
                ],
            },
            "sandbox_verdicts": {
                "Triage": {
                    "category": "malicious",
                    "confidence": 100,
                    "sandbox_name": "Triage",
                    "malware_classification": ["HACKTOOL"],
                    "malware_names": ["Mimikatz"],
                },
                "Zenbox": {
                    "category": "malicious",
                    "confidence": 95,
                    "sandbox_name": "Zenbox",
                    "malware_classification": ["HACKTOOL", "CREDENTIAL_STEALER"],
                    "malware_names": ["Mimikatz"],
                },
            },
            "crowdsourced_ids_results": [
                {
                    "rule_category": "Credential Access",
                    "alert_severity": "critical",
                    "rule_msg": "ET MALWARE Mimikatz sekurlsa::logonpasswords Activity",
                    "rule_id": "1:2018358",
                    "rule_source": "Proofpoint Emerging Threats Open",
                },
                {
                    "rule_category": "Credential Access",
                    "alert_severity": "high",
                    "rule_msg": "ET MALWARE Mimikatz LSASS Dump via ProcDump",
                    "rule_id": "1:2019214",
                    "rule_source": "Proofpoint Emerging Threats Open",
                },
            ],
        },
    }
}

_VT_HASH_LOCKBIT = {
    "data": {
        "id": "b7e2f4a9c183d0e5274bc61a3f928e1c",
        "type": "file",
        "attributes": {
            "meaningful_name": "svchost32.exe",
            "sha256": "b7e2f4a9c183d0e5274bc61a3f928e1c9d0a5b72e614f38cc91bd50a27e84f3d",
            "md5": "b7e2f4a9c183d0e5274bc61a3f928e1c",
            "type_description": "Win32 EXE",
            "type_tag": "peexe",
            "size": 892928,
            "magic": "PE32+ executable (GUI) x86-64, for MS Windows",
            "reputation": -1680,
            "times_submitted": 1183,
            "last_analysis_stats": {
                "malicious": 61,
                "suspicious": 3,
                "undetected": 4,
                "harmless": 0,
                "timeout": 0,
                "failure": 0,
                "type-unsupported": 2,
            },
            "last_analysis_date": 1746700000,
            "tags": [
                "peexe",
                "ransomware",
                "lockbit",
                "file-encryption",
                "shadow-copy-deletion",
                "uac-bypass",
                "anti-forensics",
            ],
            "total_votes": {"harmless": 1, "malicious": 148},
            "popular_threat_classification": {
                "suggested_threat_label": "ransom.lockbit/lockbit3",
                "popular_threat_category": [
                    {"count": 41, "value": "ransomware"},
                    {"count": 18, "value": "trojan"},
                ],
                "popular_threat_name": [
                    {"count": 28, "value": "lockbit"},
                    {"count": 11, "value": "lockbit3"},
                ],
            },
            "sandbox_verdicts": {
                "C2AE": {
                    "category": "malicious",
                    "confidence": 97,
                    "sandbox_name": "C2AE",
                    "malware_classification": ["RANSOM"],
                    "malware_names": ["LockBit", "LockBit3"],
                },
                "Triage": {
                    "category": "malicious",
                    "confidence": 100,
                    "sandbox_name": "Triage",
                    "malware_classification": ["RANSOM"],
                    "malware_names": ["LockBit 3.0"],
                },
            },
            "crowdsourced_ids_results": [
                {
                    "rule_category": "Ransomware Activity",
                    "alert_severity": "critical",
                    "rule_msg": "ET MALWARE Win32/LockBit Ransomware Checkin",
                    "rule_id": "1:2035912",
                    "rule_source": "Proofpoint Emerging Threats Open",
                },
                {
                    "rule_category": "Ransomware Activity",
                    "alert_severity": "high",
                    "rule_msg": "ET MALWARE LockBit 3.0 Ransom Note Observed",
                    "rule_id": "1:2036044",
                    "rule_source": "Proofpoint Emerging Threats Open",
                },
            ],
        },
    }
}

_VT_HASH_WORD_MACRO = {
    "data": {
        "id": "c2e4f9a1b3d7e081234bc56a7f918e2d",
        "type": "file",
        "attributes": {
            "meaningful_name": "Q4_Finance_Report_Draft.docm",
            "sha256": "c2e4f9a1b3d7e081234bc56a7f918e2d6a3c9b50f172e48dd05a71c83b26f9e1",
            "md5": "c2e4f9a1b3d7e081234bc56a7f918e2d",
            "type_description": "Microsoft Office DOCM",
            "type_tag": "doc",
            "size": 245760,
            "magic": "Microsoft Word 2007+",
            "reputation": -690,
            "times_submitted": 312,
            "last_analysis_stats": {
                "malicious": 34,
                "suspicious": 6,
                "undetected": 26,
                "harmless": 0,
                "timeout": 0,
                "failure": 0,
                "type-unsupported": 4,
            },
            "last_analysis_date": 1746700000,
            "tags": [
                "doc",
                "macros",
                "vba",
                "dropper",
                "auto-open",
                "obfuscated-vba",
            ],
            "total_votes": {"harmless": 2, "malicious": 61},
            "popular_threat_classification": {
                "suggested_threat_label": "trojan.macrodownloader/agentx",
                "popular_threat_category": [
                    {"count": 21, "value": "trojan-downloader"},
                    {"count": 12, "value": "trojan"},
                ],
                "popular_threat_name": [
                    {"count": 14, "value": "agentx"},
                    {"count": 7, "value": "emotet-dropper"},
                ],
            },
            "sandbox_verdicts": {
                "Joe Sandbox": {
                    "category": "malicious",
                    "confidence": 82,
                    "sandbox_name": "Joe Sandbox",
                    "malware_classification": ["DROPPER"],
                    "malware_names": ["MacroDownloader.AgentX"],
                },
                "Zenbox": {
                    "category": "malicious",
                    "confidence": 78,
                    "sandbox_name": "Zenbox",
                    "malware_classification": ["DROPPER", "MALWARE"],
                    "malware_names": ["VBA/Downloader"],
                },
            },
            "crowdsourced_ids_results": [
                {
                    "rule_category": "Malicious Document",
                    "alert_severity": "high",
                    "rule_msg": "ET MALWARE Office Macro Dropper Outbound Callback",
                    "rule_id": "1:2029031",
                    "rule_source": "Proofpoint Emerging Threats Open",
                },
            ],
        },
    }
}

# ---------------------------------------------------------------------------
# VirusTotal — mock feed IPs
# ---------------------------------------------------------------------------

_VT_IP_203_41 = {
    "data": {
        "id": "203.0.113.41",
        "type": "ip_address",
        "attributes": {
            "as_owner": "China Unicom",
            "asn": 4837,
            "country": "CN",
            "network": "203.0.113.0/24",
            "reputation": -31,
            "last_analysis_stats": {"malicious": 8, "suspicious": 3, "undetected": 59, "harmless": 6, "timeout": 0},
            "last_analysis_date": 1746700000,
            "tags": ["auth-bruteforce", "scanner"],
            "total_votes": {"harmless": 2, "malicious": 19},
            "crowdsourced_context": [
                {"detail": "Repeated authentication failures targeting VPN gateways across multiple organizations.", "source": "Emerging Threats", "timestamp": 1746600000, "severity": "medium"}
            ],
        },
    }
}

_VT_IP_198 = {
    "data": {
        "id": "198.51.100.12",
        "type": "ip_address",
        "attributes": {
            "as_owner": "Selectel",
            "asn": 49505,
            "country": "RU",
            "network": "198.51.100.0/24",
            "reputation": -22,
            "last_analysis_stats": {"malicious": 6, "suspicious": 2, "undetected": 64, "harmless": 4, "timeout": 0},
            "last_analysis_date": 1746700000,
            "tags": ["distributed-source", "proxy"],
            "total_votes": {"harmless": 1, "malicious": 12},
            "crowdsourced_context": [
                {"detail": "Used as a rotating proxy node in distributed credential stuffing campaigns.", "source": "Abuse.ch", "timestamp": 1746500000, "severity": "medium"}
            ],
        },
    }
}

_VT_IP_192 = {
    "data": {
        "id": "192.0.2.88",
        "type": "ip_address",
        "attributes": {
            "as_owner": "Leaseweb Netherlands",
            "asn": 60781,
            "country": "NL",
            "network": "192.0.2.0/24",
            "reputation": -25,
            "last_analysis_stats": {"malicious": 7, "suspicious": 1, "undetected": 66, "harmless": 3, "timeout": 0},
            "last_analysis_date": 1746700000,
            "tags": ["session-hijack", "scanner"],
            "total_votes": {"harmless": 2, "malicious": 14},
            "crowdsourced_context": [
                {"detail": "Session origin for anomalous Azure AD sign-in attempts from unfamiliar ASN.", "source": "Microsoft Sentinel", "timestamp": 1746650000, "severity": "medium"}
            ],
        },
    }
}

# ---------------------------------------------------------------------------
# VirusTotal — mock feed domains
# ---------------------------------------------------------------------------

_VT_DOMAIN_LOGIN_SECURE = {
    "data": {
        "id": "login-secure-upd.example.net",
        "type": "domain",
        "attributes": {
            "registrar": "GoDaddy LLC",
            "creation_date": 1740000000,
            "last_update_date": 1746000000,
            "reputation": -39,
            "last_analysis_stats": {"malicious": 15, "suspicious": 4, "undetected": 48, "harmless": 5, "timeout": 0},
            "last_analysis_date": 1746700000,
            "tags": ["phishing", "credential-harvester", "safe-links-bypass"],
            "total_votes": {"harmless": 0, "malicious": 22},
            "categories": {"Forcepoint ThreatSeeker": "phishing", "Trend Micro": "phish"},
            "popular_threat_classification": {
                "suggested_threat_label": "phishing/o365-credential-harvest",
                "popular_threat_category": [{"count": 12, "value": "phishing"}, {"count": 5, "value": "trojan-downloader"}],
            },
        },
    }
}

_VT_DOMAIN_CDN_TYPOSQUAT = {
    "data": {
        "id": "cdn-assets.typosquat.test",
        "type": "domain",
        "attributes": {
            "registrar": "Namecheap, Inc.",
            "creation_date": 1743000000,
            "last_update_date": 1746200000,
            "reputation": -32,
            "last_analysis_stats": {"malicious": 10, "suspicious": 3, "undetected": 51, "harmless": 7, "timeout": 0},
            "last_analysis_date": 1746700000,
            "tags": ["typosquat", "phishing", "brand-impersonation"],
            "total_votes": {"harmless": 1, "malicious": 17},
            "categories": {"Sophos": "phishing", "Webroot": "phishing and other frauds"},
            "popular_threat_classification": {
                "suggested_threat_label": "phishing/typosquat-cdn",
                "popular_threat_category": [{"count": 9, "value": "phishing"}, {"count": 4, "value": "trojan-downloader"}],
            },
        },
    }
}

# ---------------------------------------------------------------------------
# VirusTotal — mock feed hashes
# ---------------------------------------------------------------------------

_VT_HASH_ENCODED_PAYLOAD = {
    "data": {
        "id": "a3f1c9b2e847d6f0391cc52a4e1b7f3da3f1c9b2e847d6f0391cc52a4e1b7f3d",
        "type": "file",
        "attributes": {
            "meaningful_name": "update_helper.ps1",
            "sha256": "a3f1c9b2e847d6f0391cc52a4e1b7f3da3f1c9b2e847d6f0391cc52a4e1b7f3d",
            "md5": "a3f1c9b2e847d6f0391cc52a4e1b7f3d",
            "type_description": "PS1",
            "type_tag": "script",
            "size": 18432,
            "magic": "ASCII text, with CRLF line terminators",
            "reputation": -890,
            "times_submitted": 287,
            "last_analysis_stats": {"malicious": 45, "suspicious": 5, "undetected": 18, "harmless": 0, "timeout": 0, "failure": 0, "type-unsupported": 2},
            "last_analysis_date": 1746700000,
            "tags": ["script", "powershell", "encoded-command", "dropper", "obfuscated"],
            "total_votes": {"harmless": 1, "malicious": 84},
            "popular_threat_classification": {
                "suggested_threat_label": "trojan.ps1/encodeddownloader",
                "popular_threat_category": [{"count": 24, "value": "trojan-downloader"}, {"count": 14, "value": "trojan"}],
                "popular_threat_name": [{"count": 16, "value": "powershell-downloader"}, {"count": 9, "value": "encodedcmd"}],
            },
            "sandbox_verdicts": {
                "Triage": {"category": "malicious", "confidence": 93, "sandbox_name": "Triage", "malware_classification": ["DROPPER"], "malware_names": ["PS1/EncodedDownloader"]},
                "Any.run": {"category": "malicious", "confidence": 88, "sandbox_name": "Any.run", "malware_classification": ["DROPPER", "SCRIPT"], "malware_names": ["PowerShell Dropper"]},
            },
            "crowdsourced_ids_results": [
                {"rule_category": "Malicious Script", "alert_severity": "high", "rule_msg": "ET MALWARE PowerShell Encoded Command Dropper Activity", "rule_id": "1:2031218", "rule_source": "Proofpoint Emerging Threats Open"}
            ],
        },
    }
}

_VT_HASH_SUSPICIOUS_MODULE = {
    "data": {
        "id": "b4e2d0c3f958e7a140a2dd63b5f2c8e4b4e2d0c3f958e7a140a2dd63b5f2c8e4",
        "type": "file",
        "attributes": {
            "meaningful_name": "wbemcomn2.dll",
            "sha256": "b4e2d0c3f958e7a140a2dd63b5f2c8e4b4e2d0c3f958e7a140a2dd63b5f2c8e4",
            "md5": "b4e2d0c3f958e7a140a2dd63b5f2c8e4",
            "type_description": "Win32 DLL",
            "type_tag": "peexe",
            "size": 421888,
            "magic": "PE32+ executable (DLL) x86-64, for MS Windows",
            "reputation": -610,
            "times_submitted": 143,
            "last_analysis_stats": {"malicious": 28, "suspicious": 4, "undetected": 36, "harmless": 0, "timeout": 0, "failure": 0, "type-unsupported": 2},
            "last_analysis_date": 1746700000,
            "tags": ["peexe", "dll", "dll-sideloading", "wmi-abuse", "lateral-movement"],
            "total_votes": {"harmless": 0, "malicious": 47},
            "popular_threat_classification": {
                "suggested_threat_label": "trojan.loader/wmi-sideload",
                "popular_threat_category": [{"count": 17, "value": "trojan"}, {"count": 9, "value": "trojan-downloader"}],
                "popular_threat_name": [{"count": 11, "value": "wmisideload"}, {"count": 6, "value": "cobaltstrike-loader"}],
            },
            "sandbox_verdicts": {
                "Zenbox": {"category": "malicious", "confidence": 85, "sandbox_name": "Zenbox", "malware_classification": ["TROJAN"], "malware_names": ["WMI/SideLoader"]},
                "Joe Sandbox": {"category": "malicious", "confidence": 80, "sandbox_name": "Joe Sandbox", "malware_classification": ["LOADER"], "malware_names": ["DLL Sideloader"]},
            },
            "crowdsourced_ids_results": [
                {"rule_category": "Lateral Movement", "alert_severity": "high", "rule_msg": "ET MALWARE WMI Lateral Movement DLL Implant Detected", "rule_id": "1:2033104", "rule_source": "Proofpoint Emerging Threats Open"}
            ],
        },
    }
}

# ---------------------------------------------------------------------------
# AbuseIPDB — IP check reports
# ---------------------------------------------------------------------------

_ABUSEIPDB_185 = {
    "data": {
        "ipAddress": "185.220.101.47",
        "isPublic": True,
        "ipVersion": 4,
        "isWhitelisted": False,
        "abuseConfidenceScore": 88,
        "countryCode": "DE",
        "usageType": "Data Center/Web Hosting/Transit",
        "isp": "Hetzner Online GmbH",
        "domain": "hetzner.com",
        "hostnames": ["tor-exit-relay.example.org"],
        "isTor": True,
        "totalReports": 512,
        "numDistinctUsers": 304,
        "lastReportedAt": "2026-05-03T08:14:22+00:00",
    }
}

_ABUSEIPDB_45 = {
    "data": {
        "ipAddress": "45.142.212.100",
        "isPublic": True,
        "ipVersion": 4,
        "isWhitelisted": False,
        "abuseConfidenceScore": 74,
        "countryCode": "NL",
        "usageType": "Data Center/Web Hosting/Transit",
        "isp": "Frantech Solutions",
        "domain": "frantech.ca",
        "hostnames": [],
        "isTor": False,
        "totalReports": 247,
        "numDistinctUsers": 131,
        "lastReportedAt": "2026-05-02T21:38:55+00:00",
    }
}

_ABUSEIPDB_203_41 = {
    "data": {
        "ipAddress": "203.0.113.41",
        "isPublic": True,
        "ipVersion": 4,
        "isWhitelisted": False,
        "abuseConfidenceScore": 68,
        "countryCode": "CN",
        "usageType": "Fixed Line ISP",
        "isp": "China Unicom",
        "domain": "chinaunicom.cn",
        "hostnames": [],
        "isTor": False,
        "totalReports": 143,
        "numDistinctUsers": 78,
        "lastReportedAt": "2026-05-02T17:44:10+00:00",
    }
}

_ABUSEIPDB_198 = {
    "data": {
        "ipAddress": "198.51.100.12",
        "isPublic": True,
        "ipVersion": 4,
        "isWhitelisted": False,
        "abuseConfidenceScore": 55,
        "countryCode": "RU",
        "usageType": "Data Center/Web Hosting/Transit",
        "isp": "Selectel",
        "domain": "selectel.ru",
        "hostnames": [],
        "isTor": False,
        "totalReports": 89,
        "numDistinctUsers": 51,
        "lastReportedAt": "2026-05-01T22:19:33+00:00",
    }
}

_ABUSEIPDB_192 = {
    "data": {
        "ipAddress": "192.0.2.88",
        "isPublic": True,
        "ipVersion": 4,
        "isWhitelisted": False,
        "abuseConfidenceScore": 61,
        "countryCode": "NL",
        "usageType": "Data Center/Web Hosting/Transit",
        "isp": "Leaseweb Netherlands",
        "domain": "leaseweb.com",
        "hostnames": [],
        "isTor": False,
        "totalReports": 112,
        "numDistinctUsers": 64,
        "lastReportedAt": "2026-05-03T04:31:07+00:00",
    }
}

_ABUSEIPDB_203 = {
    "data": {
        "ipAddress": "203.0.113.200",
        "isPublic": True,
        "ipVersion": 4,
        "isWhitelisted": False,
        "abuseConfidenceScore": 70,
        "countryCode": "CN",
        "usageType": "Fixed Line ISP",
        "isp": "China Telecom",
        "domain": "chinatelecom.cn",
        "hostnames": [],
        "isTor": False,
        "totalReports": 189,
        "numDistinctUsers": 97,
        "lastReportedAt": "2026-05-01T14:07:30+00:00",
    }
}

# ---------------------------------------------------------------------------
# Lookup tables
# ---------------------------------------------------------------------------

_VT_BY_VALUE: dict[str, dict] = {
    # Seed case IOCs
    "185.220.101.47": _VT_IP_185,
    "45.142.212.100": _VT_IP_45,
    "203.0.113.200": _VT_IP_203,
    "corp-mail-auth.ru": _VT_DOMAIN_CORP_MAIL,
    "a3f1c9b2e847d6f0391cc52a4e1b7f3d": _VT_HASH_MIMIKATZ,
    "b7e2f4a9c183d0e5274bc61a3f928e1c": _VT_HASH_LOCKBIT,
    "c2e4f9a1b3d7e081234bc56a7f918e2d": _VT_HASH_WORD_MACRO,
    "24d004a104d4d54034dbcffc2a4b19a11f39008a575aa614ea04703480b1022c": _VT_HASH_WANNACRY,
    # Mock feed IOC pool
    "203.0.113.41": _VT_IP_203_41,
    "198.51.100.12": _VT_IP_198,
    "192.0.2.88": _VT_IP_192,
    "login-secure-upd.example.net": _VT_DOMAIN_LOGIN_SECURE,
    "cdn-assets.typosquat.test": _VT_DOMAIN_CDN_TYPOSQUAT,
    "a3f1c9b2e847d6f0391cc52a4e1b7f3da3f1c9b2e847d6f0391cc52a4e1b7f3d": _VT_HASH_ENCODED_PAYLOAD,
    "b4e2d0c3f958e7a140a2dd63b5f2c8e4b4e2d0c3f958e7a140a2dd63b5f2c8e4": _VT_HASH_SUSPICIOUS_MODULE,
}

_ABUSEIPDB_BY_VALUE: dict[str, dict] = {
    # Seed case IOCs
    "185.220.101.47": _ABUSEIPDB_185,
    "45.142.212.100": _ABUSEIPDB_45,
    "203.0.113.200": _ABUSEIPDB_203,
    # Mock feed IOC pool
    "203.0.113.41": _ABUSEIPDB_203_41,
    "198.51.100.12": _ABUSEIPDB_198,
    "192.0.2.88": _ABUSEIPDB_192,
}

_VT_TOOL_NAMES = {
    "vt_ip_report",
    "vt_hash_lookup",
    "vt_domain_scan",
    # Tines tool names used by enrichment service
    "search_for_files_urls_domains_ips_and_comments",
}

_ABUSEIPDB_TOOL_NAMES = {
    "abuseipdb_check_ip",
    "abuseipdb_ip_reports",
    # Tines tool names used by enrichment service
    "search_for_an_ip_address",
    "get_reports_for_an_ip_address",
}

_VT_FALLBACK = _VT_HASH_WANNACRY
_ABUSEIPDB_FALLBACK = _ABUSEIPDB_185


def get_demo_response(tool_name: str, params: dict) -> dict:
    """Return a realistic mock response for demo mode, keyed by IOC value."""
    if tool_name in _VT_TOOL_NAMES:
        value = (
            params.get("ip")
            or params.get("hash")
            or params.get("domain")
            or params.get("query")
            or ""
        )
        return _VT_BY_VALUE.get(value, _VT_FALLBACK)

    if tool_name in _ABUSEIPDB_TOOL_NAMES:
        value = params.get("ip") or params.get("ip_address") or ""
        return _ABUSEIPDB_BY_VALUE.get(value, _ABUSEIPDB_FALLBACK)

    return {}
