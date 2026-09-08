import warnings
warnings.filterwarnings("ignore", message=".*st.components.v1.html.*")
warnings.filterwarnings("ignore", category=UserWarning)

import streamlit as st
import streamlit.components.v1 as components
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import requests
import base64
import time
from pathlib import Path
import gspread
from oauth2client.service_account import ServiceAccountCredentials

API_KEY = st.secrets["API_KEY"]
ACT_START_DATE = pd.Timestamp("2026-03-18 21:00:00", tz="UTC")

st.set_page_config(
    page_title="iNTellectual // Valorant Dashboard",
    page_icon="🎯",
    layout="wide",
    initial_sidebar_state="collapsed"
)
pd.options.mode.chained_assignment = None

# =========================================================
# BACKGROUND ENGINE
# =========================================================
def set_background(video="background.mp4"):
    path = Path(video)
    if path.exists():
        encoded = base64.b64encode(path.read_bytes()).decode()
        st.markdown(f"""
        <style>
        .block-container {{padding: 1.2rem 2rem 3rem 2rem !important; max-width: 100% !important;}}
        header, footer {{visibility: hidden;}}
        .stApp {{background: transparent;}}
        #bgvid {{
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            object-fit: cover; z-index: -1000; filter: brightness(0.22) contrast(1.15);
        }}
        .overlay {{
            position: fixed; inset: 0;
            background: radial-gradient(circle at 50% 30%, rgba(255,70,85,0.12), rgba(6,7,10,0.95) 75%);
            z-index: -999;
            pointer-events: none;
        }}
        </style>
        <video autoplay muted loop playsinline id="bgvid">
            <source src="data:video/mp4;base64,{encoded}" type="video/mp4">
        </video>
        <div class="overlay"></div>
        """, unsafe_allow_html=True)
    else:
        st.markdown("""
        <style>
        .block-container {{padding: 1.2rem 2rem 3rem 2rem !important; max-width: 100% !important;}}
        header, footer {{visibility: hidden;}}
        .stApp {{
            background: radial-gradient(circle at 50% 25%, #180d14 0%, #06070a 80%);
            color: #ece8e1;
        }}
        </style>
        """, unsafe_allow_html=True)

set_background()

# =========================================================
# VCT DESIGN SYSTEM & GLOBAL CSS
# =========================================================
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Noto+Sans+JP:wght@500;700;900&family=Syncopate:wght@700&family=Teko:wght@500;600;700&display=swap');

:root {
    --val-red: #ff4655;
    --val-dark: #0f1923;
    --val-black: #06070a;
    --val-cyan: #5bf8ff;
    --val-gold: #fbbf24;
    --val-card: rgba(14, 18, 26, 0.72);
    --val-border: rgba(255, 70, 85, 0.35);
}

body, button, input, select {
    font-family: 'Inter', -apple-system, sans-serif;
}

/* TOP COMMAND BANNER */
.vct-header {
    text-align: center;
    padding: 18px 0 10px 0;
    position: relative;
}
.vct-ticker {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 70, 85, 0.15);
    border: 1px solid rgba(255, 70, 85, 0.4);
    border-radius: 20px;
    padding: 3px 14px;
    font-family: 'Syncopate', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 2px;
    color: #ff4655;
    text-transform: uppercase;
    margin-bottom: 12px;
}
.pulse-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #ff4655;
    box-shadow: 0 0 10px #ff4655;
    animation: live-pulse 1.4s infinite ease-in-out;
}
@keyframes live-pulse {
    0%, 100% { opacity: 0.3; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.3); }
}
.vct-title {
    font-family: 'Teko', sans-serif;
    font-size: 76px;
    font-weight: 700;
    letter-spacing: 10px;
    text-transform: uppercase;
    line-height: 0.9;
    margin: 0;
    background: linear-gradient(180deg, #ffffff 15%, #ffccd0 50%, #ff4655 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 25px rgba(255,70,85,0.45));
}
.vct-subtitle {
    font-family: 'Syncopate', sans-serif;
    font-size: 11px;
    letter-spacing: 6px;
    color: #94a3b8;
    text-transform: uppercase;
    margin-top: 6px;
}
.vct-divider {
    width: 140px;
    height: 2px;
    margin: 16px auto 24px auto;
    background: linear-gradient(90deg, transparent, #ff4655, transparent);
}

/* CARDS */
.hud-card {
    background: var(--val-card);
    border: 1px solid var(--val-border);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    backdrop-filter: blur(12px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
    position: relative;
    overflow: hidden;
}
.hud-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; width: 40px; height: 2px;
    background: #ff4655;
    box-shadow: 0 0 10px #ff4655;
}
.hud-title {
    font-family: 'Teko', sans-serif;
    font-size: 24px;
    letter-spacing: 3px;
    color: #ff4655;
    text-transform: uppercase;
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 10px;
}
.hud-title span {
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    color: #94a3b8;
    letter-spacing: 1px;
}

/* KPI STRIP */
.kpi-container {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 22px;
}
.kpi-box {
    background: rgba(18, 22, 32, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-left: 3px solid #ff4655;
    border-radius: 8px;
    padding: 14px 18px;
    backdrop-filter: blur(8px);
    transition: transform 0.2s ease, border-color 0.2s ease;
}
.kpi-box:hover {
    transform: translateY(-3px);
    border-color: rgba(255, 70, 85, 0.6);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}
.kpi-label {
    font-family: 'Syncopate', sans-serif;
    font-size: 9px;
    letter-spacing: 1.5px;
    color: #94a3b8;
    text-transform: uppercase;
}
.kpi-val {
    font-family: 'Teko', sans-serif;
    font-size: 38px;
    font-weight: 700;
    color: #ffffff;
    line-height: 1;
    margin-top: 4px;
}
.kpi-sub {
    font-size: 11px;
    color: #64748b;
    margin-top: 2px;
}

/* TABS OVERHAUL */
.stTabs [data-baseweb="tab-list"] {
    gap: 8px;
    background: rgba(10, 12, 18, 0.85);
    padding: 8px 12px;
    border-radius: 12px;
    border: 1px solid rgba(255, 70, 85, 0.25);
    backdrop-filter: blur(14px);
    margin-bottom: 22px;
}
.stTabs [data-baseweb="tab"] {
    font-family: 'Syncopate', sans-serif;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 2px;
    color: #94a3b8;
    border-radius: 8px;
    padding: 10px 22px;
    border: none !important;
    background: transparent;
    transition: all 0.25s ease;
}
.stTabs [data-baseweb="tab"]:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.04);
}
.stTabs [aria-selected="true"] {
    background: linear-gradient(135deg, #ff4655 0%, #b81424 100%) !important;
    color: #ffffff !important;
    box-shadow: 0 0 20px rgba(255, 70, 85, 0.5);
}

/* STREAMLIT BUTTONS & INPUTS */
div.stButton > button {
    background: linear-gradient(135deg, rgba(255,70,85,0.2), rgba(0,0,0,0.8));
    color: #ffffff;
    border: 1px solid #ff4655;
    border-radius: 6px;
    font-family: 'Syncopate', sans-serif;
    font-size: 11px;
    letter-spacing: 2px;
    font-weight: 700;
    padding: 10px 24px;
    transition: all 0.25s ease;
}
div.stButton > button:hover {
    background: #ff4655;
    color: #06070a;
    box-shadow: 0 0 25px rgba(255, 70, 85, 0.6);
    transform: scale(1.02);
}

/* LEADERBOARD ROWS */
.leader-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 18px;
    margin-bottom: 10px;
    background: rgba(16, 20, 30, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.06);
    border-radius: 8px;
    transition: 0.2s ease;
}
.leader-row:hover {
    transform: translateX(4px);
    border-color: rgba(255, 70, 85, 0.5);
    background: rgba(24, 28, 42, 0.85);
}
.leader-row.mvp-row {
    border: 1px solid rgba(251, 191, 36, 0.6);
    background: linear-gradient(90deg, rgba(251,191,36,0.12), rgba(16,20,30,0.7));
    box-shadow: 0 0 20px rgba(251, 191, 36, 0.15);
}
.leader-left {
    display: flex;
    align-items: center;
    gap: 16px;
}
.leader-rank {
    font-family: 'Teko', sans-serif;
    font-size: 28px;
    font-weight: 700;
    min-width: 32px;
    color: #ffffff;
}
.leader-avatar {
    width: 46px;
    height: 46px;
    border-radius: 6px;
    object-fit: cover;
    border: 1px solid rgba(255, 255, 255, 0.15);
}
.leader-info b {
    font-size: 16px;
    color: #ffffff;
    letter-spacing: 0.5px;
}
.leader-stats {
    display: flex;
    align-items: center;
    gap: 20px;
}
.leader-stat-box {
    text-align: right;
}
.leader-stat-lbl {
    font-size: 9px;
    color: #94a3b8;
    text-transform: uppercase;
    font-family: 'Syncopate', sans-serif;
}
.leader-stat-val {
    font-family: 'Teko', sans-serif;
    font-size: 22px;
    color: #ffffff;
    line-height: 1;
}

/* ROLE BADGES */
.badge-role {
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
}
.badge-duelist { background: #ff4655; color: white; }
.badge-controller { background: #3b82f6; color: white; }
.badge-initiator { background: #10b981; color: white; }
.badge-sentinel { background: #f59e0b; color: black; }
.badge-igl { background: #8b5cf6; color: white; }

/* TIER PILL */
.tier-pill {
    padding: 3px 10px;
    border-radius: 4px;
    font-family: 'Teko', sans-serif;
    font-size: 18px;
    font-weight: 700;
    line-height: 1;
}
.tier-s { background: rgba(251, 191, 36, 0.2); color: #fbbf24; border: 1px solid #fbbf24; }
.tier-a { background: rgba(91, 248, 255, 0.2); color: #5bf8ff; border: 1px solid #5bf8ff; }
.tier-b { background: rgba(192, 132, 252, 0.2); color: #c084fc; border: 1px solid #c084fc; }
.tier-c { background: rgba(148, 163, 184, 0.2); color: #94a3b8; border: 1px solid #94a3b8; }
</style>

<div class="vct-header">
    <div class="vct-ticker"><div class="pulse-dot"></div> TELEMETRY SYNCED // RADIANT PROTOCOL</div>
    <h1 class="vct-title">GAME DRIFTERS</h1>
    <div class="vct-subtitle">VCT Esports Intelligence & Player Performance Platform</div>
    <div class="vct-divider"></div>
</div>
""", unsafe_allow_html=True)

# =========================================================
# DATA ENGINE & API INTEGRATION
# =========================================================
SHEET_URL = "https://docs.google.com/spreadsheets/d/1p5u4T--HBuZhsoFBUoZmLnYH7Qvk8m7Ts7flv7xVCW0/export?format=csv&gid=0"
HISTORY_URL = "https://docs.google.com/spreadsheets/d/1p5u4T--HBuZhsoFBUoZmLnYH7Qvk8m7Ts7flv7xVCW0/gviz/tq?tqx=out:csv&sheet=Data"

def clean_riot_id(player):
    if pd.isna(player):
        return None
    p = str(player).replace("\xa0", " ")
    p = " ".join(p.split()).replace(" #", "#")
    return p.strip()

def fetch_tracker_stats(riot_id):
    try:
        name, tag = riot_id.split("#")
        headers = {"Authorization": API_KEY}
        acc_url = f"https://api.henrikdev.xyz/valorant/v1/account/{name.strip().lower()}/{tag.strip().lower()}"
        acc = requests.get(acc_url, headers=headers)
        if acc.status_code != 200:
            return None
        account = acc.json()["data"]
        region_raw = str(account.get("region", "")).lower()
        region = region_raw if region_raw in ["ap", "eu", "na", "kr", "latam", "br"] else "ap"
        player_puuid = account["puuid"]

        url = f"https://api.henrikdev.xyz/valorant/v3/by-puuid/matches/{region}/{player_puuid}?mode=competitive&size=20"
        r = requests.get(url, headers=headers)
        if r.status_code != 200:
            return None

        matches = r.json()["data"]
        total_kills, total_deaths, total_assists = 0, 0, 0
        total_headshots, total_shots, total_score, total_rounds = 0, 0, 0, 0
        comp_games = 0

        for match in matches:
            meta = match["metadata"]
            qm = (str(meta.get("queue", "")) + str(meta.get("mode", ""))).lower()
            if any(x in qm for x in ["deathmatch", "swift", "spike", "escalation", "replication", "snowball", "custom"]):
                continue
            rounds = max(1, meta.get("rounds_played", 1))
            for p in match["players"]["all_players"]:
                if p.get("puuid") != player_puuid:
                    continue
                st_data = p["stats"]
                k, d, a = st_data["kills"], st_data["deaths"], st_data["assists"]
                hs, bs, ls = st_data["headshots"], st_data["bodyshots"], st_data["legshots"]
                total_kills += k
                total_deaths += d
                total_assists += a
                total_headshots += hs
                total_shots += (hs + bs + ls)
                total_score += st_data.get("damage_made", 0) + (k * 150) + (a * 50)
                total_rounds += rounds
                comp_games += 1
                break
            if comp_games >= 20:
                break

        if comp_games == 0:
            return None

        return {
            "KD": round(total_kills / max(1, total_deaths), 2),
            "ACS": round(total_score / max(1, total_rounds), 1),
            "HS%": round((total_headshots / max(1, total_shots)) * 100, 1)
        }
    except Exception as e:
        st.error(f"API Error: {e}")
        return None

@st.cache_data(ttl=30)
def load():
    df = pd.read_csv(SHEET_URL)
    df.columns = df.columns.str.strip()
    df = df[df["Player"].notna() & df["Player"].astype(str).str.contains("#")]
    df["Player"] = df["Player"].apply(clean_riot_id)
    df["Date"] = pd.to_datetime(df["Date"], errors="coerce", dayfirst=True)

    history = pd.read_csv(HISTORY_URL)
    history.columns = history.columns.str.strip()
    history["Player"] = history["Player"].apply(clean_riot_id)
    history["Date"] = pd.to_datetime(history["Date"], errors="coerce", dayfirst=True)
    for col in ["HS%", "ACS", "KD"]:
        history[col] = pd.to_numeric(history[col], errors="coerce")

    return df.sort_values("Date"), history.sort_values("Date")

df, history = load()

# SYNC ACTION BUTTON
col_btn, col_info = st.columns([2, 5])
with col_btn:
    if st.button("⚡ UPDATE LIVE STATS"):
        scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
        creds = ServiceAccountCredentials.from_json_keyfile_dict(st.secrets["gcp_service_account"], scope)
        client = gspread.authorize(creds)
        spreadsheet = client.open_by_key("1p5u4T--HBuZhsoFBUoZmLnYH7Qvk8m7Ts7flv7xVCW0")
        sheet = spreadsheet.sheet1
        data_sheet = spreadsheet.worksheet("Data")

        rows = sheet.get_all_values()
        header = rows[0]
        player_col = header.index("Player")
        batch_updates = []
        updated, processed = 0, 0
        today = pd.Timestamp.today().strftime("%d-%m-%Y")
        history_rows = data_sheet.get_all_values()
        history_lookup = {(r[0], r[1]): i for i, r in enumerate(history_rows[1:], start=2) if len(r) >= 2}

        progress = st.progress(0, text="Synchronizing player stats from HenrikDev...")
        for sheet_row, row in enumerate(rows[1:], start=2):
            if len(row) <= player_col:
                continue
            riot_id = row[player_col].strip()
            if "#" not in riot_id:
                continue
            stats = fetch_tracker_stats(riot_id)
            processed += 1
            if stats:
                batch_updates.append({
                    "range": f"J{sheet_row}:L{sheet_row}",
                    "values": [[stats["HS%"], stats["ACS"], stats["KD"]]]
                })
                role = row[header.index("Role")]
                agent = row[header.index("Agent")]
                p_found = history_lookup.get((today, riot_id))
                hist_data = [
                    today, riot_id, role, agent,
                    row[header.index("Aim")], row[header.index("Utility")], row[header.index("Comms")],
                    row[header.index("Entry")], row[header.index("Clutch")],
                    stats["HS%"], stats["ACS"], stats["KD"]
                ]
                if p_found:
                    data_sheet.update(f"A{p_found}:L{p_found}", [hist_data])
                else:
                    data_sheet.append_row(hist_data)
                updated += 1
            if processed % 5 == 0:
                time.sleep(5)
            progress.progress(min(1.0, processed / max(1, len(rows) - 1)))

        if batch_updates:
            sheet.batch_update(batch_updates)
        st.success(f"✓ Synchronized {updated} player profiles successfully!")

with col_info:
    st.markdown(f"""
    <div style="font-size:12px;color:#94a3b8;padding-top:10px;">
        <b>ACT START:</b> 2026-03-18 (Active) &nbsp;|&nbsp; 
        <b>TRACKER:</b> HenrikDev v3 API &nbsp;|&nbsp; 
        <b>DATA SYNC:</b> Live Google Sheets
    </div>
    """, unsafe_allow_html=True)

# =========================================================
# METRICS, NORMALIZATION & SCORING
# =========================================================
for col in df.columns:
    if col not in ["Date", "Player", "Role", "Agent"]:
        df[col] = pd.to_numeric(df[col], errors="coerce")

ROLE_STATS = {
    "Duelist": {"HS%": 26, "ACS": 265, "KD": 1.32},
    "Controller": {"HS%": 22, "ACS": 220, "KD": 1.18},
    "Initiator": {"HS%": 23, "ACS": 235, "KD": 1.22},
    "Sentinel": {"HS%": 22, "ACS": 230, "KD": 1.20},
    "IGL": {"HS%": 20, "ACS": 205, "KD": 1.10}
}
ROLE_TARGETS = {
    "Duelist": {"Aim": 9, "Utility": 6.5, "Comms": 7, "Entry": 10, "Clutch": 7.5},
    "Controller": {"Aim": 7.5, "Utility": 9, "Comms": 8.5, "Entry": 6, "Clutch": 8.5},
    "Initiator": {"Aim": 8, "Utility": 9.5, "Comms": 8.5, "Entry": 8.5, "Clutch": 8},
    "Sentinel": {"Aim": 7.5, "Utility": 8.5, "Comms": 8, "Entry": 5.5, "Clutch": 9},
    "IGL": {"Aim": 7, "Utility": 8, "Comms": 10, "Entry": 6.5, "Clutch": 9.5}
}

def rate(stat, val, role):
    if pd.isna(val):
        return np.nan
    if stat in ["Aim", "Utility", "Comms", "Entry", "Clutch"]:
        target = ROLE_TARGETS.get(role, {}).get(stat)
        if target:
            return np.clip((val / target) * 10, 0, 10)
    if stat in ["HS%", "ACS", "KD"]:
        avg = ROLE_STATS.get(role, {}).get(stat)
        if avg:
            return np.clip((val / avg) * 10, 0, 10)
    return np.nan

metrics = ["Aim", "Utility", "Comms", "Entry", "Clutch", "HS%", "ACS", "KD"]
norm = df.copy()
for m in metrics:
    if m in norm.columns:
        norm[m] = norm.apply(lambda r: rate(m, r[m], r["Role"]), axis=1)

coach_metrics = ["Aim", "Utility", "Comms", "Entry", "Clutch"]
stat_metrics = ["HS%", "ACS", "KD"]
norm["CoachScore"] = norm[coach_metrics].mean(axis=1, skipna=True)
norm["StatScore"] = norm[stat_metrics].mean(axis=1, skipna=True)

ROLE_WEIGHTS = {
    "Duelist": 0.40,
    "Initiator": 0.35,
    "Controller": 0.30,
    "Sentinel": 0.30,
    "IGL": 0.25
}

def final_score(row):
    role = row["Role"]
    stat_w = ROLE_WEIGHTS.get(role, 0.30)
    coach_w = 1 - stat_w
    coach = row["CoachScore"] if pd.notna(row["CoachScore"]) else 0
    stat = row["StatScore"] if pd.notna(row["StatScore"]) else 0
    return (coach * coach_w) + (stat * stat_w)

norm["Overall"] = norm.apply(final_score, axis=1)

# =========================================================
# AGENT VISUAL ASSETS & THEMES
# =========================================================
AGENT_IMAGES = {
    "jett":"https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png",
    "raze":"https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5aa313dba261/displayicon.png",
    "reyna":"https://media.valorant-api.com/agents/a3bfb853-43b2-7238-a4f1-ad90e9e46bcc/displayicon.png",
    "phoenix":"https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7921d69/displayicon.png",
    "yoru":"https://media.valorant-api.com/agents/7f94d92c-4234-0a36-9646-3a87eb8b5c89/displayicon.png",
    "neon":"https://media.valorant-api.com/agents/bb2a4828-46eb-8cd1-e765-15848195d751/displayicon.png",
    "iso":"https://media.valorant-api.com/agents/0e38b510-41a8-5780-5e8f-568b2a4f2d6c/displayicon.png",
    "omen":"https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png",
    "brimstone":"https://media.valorant-api.com/agents/9f0d8ba9-4140-b941-57d3-a7ad57c6b417/displayicon.png",
    "viper":"https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494859/displayicon.png",
    "astra":"https://media.valorant-api.com/agents/41fb69c1-4189-7b37-f117-bcaf1e96f1bf/displayicon.png",
    "harbor":"https://media.valorant-api.com/agents/95b78ed7-4637-86d9-7e41-71ba8c293152/displayicon.png",
    "clove":"https://media.valorant-api.com/agents/1dbf2edd-4729-0984-3115-daa5eed44993/displayicon.png",
    "sova":"https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png",
    "breach":"https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-13acf203c006/displayicon.png",
    "skye":"https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/displayicon.png",
    "kay/o":"https://media.valorant-api.com/agents/601dbbe7-43ce-be57-2a40-4abd24953621/displayicon.png",
    "fade":"https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/displayicon.png",
    "gekko":"https://media.valorant-api.com/agents/e370fa57-4757-3604-3648-499e1f642d3f/displayicon.png",
    "sage":"https://media.valorant-api.com/agents/569fdd95-4d10-43ab-ca70-79becc718b46/displayicon.png",
    "cypher":"https://media.valorant-api.com/agents/117ed9e3-49f3-6512-3ccf-0cada7e3823b/displayicon.png",
    "killjoy":"https://media.valorant-api.com/agents/1e58de9c-4950-5125-93e9-a0aee9f98746/displayicon.png",
    "chamber":"https://media.valorant-api.com/agents/22697a3d-45bf-8dd7-4fec-84a9e28c69d7/displayicon.png",
    "deadlock":"https://media.valorant-api.com/agents/cc8b64c8-4b25-4ff9-6e7f-37b4da43d235/displayicon.png",
    "vyse":"https://media.valorant-api.com/agents/efba5359-4016-a1e5-7626-b1ae76895940/displayicon.png"
}

def agent_img(agent):
    if pd.isna(agent):
        return ""
    return AGENT_IMAGES.get(str(agent).lower().strip(), "")

AGENT_PROFILES = {
    "jett": {"portrait": "https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/fullportrait.png", "quote_en": "Watch this! You can't catch the wind.", "quote_jp": "風のように舞う！覚悟しな！", "kanji": "疾風", "sub_jp": "ジェット // DUELIST", "color": "#5bf8ff", "accent": "rgba(91, 248, 255, 0.4)", "bg_kanji": "風"},
    "reyna": {"portrait": "https://media.valorant-api.com/agents/a3bfb853-43b2-7238-a4f1-ad90e9e46bcc/fullportrait.png", "quote_en": "They will cower. Give me more hearts!", "quote_jp": "命を喰らう…もっと心を捧げなさい！", "kanji": "魂魄", "sub_jp": "レイナ // DUELIST", "color": "#e83e8c", "accent": "rgba(232, 62, 140, 0.4)", "bg_kanji": "魂"},
    "raze": {"portrait": "https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5aa313dba261/fullportrait.png", "quote_en": "Fire in the hole! Boom boom baby!", "quote_jp": "大爆発の時間だ！吹き飛べ！", "kanji": "爆裂", "sub_jp": "レイズ // DUELIST", "color": "#ff7700", "accent": "rgba(255, 119, 0, 0.4)", "bg_kanji": "爆"},
    "phoenix": {"portrait": "https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7921d69/fullportrait.png", "quote_en": "Just take a seat, I got this.", "quote_jp": "火傷すんなよ！俺に任せとけ。", "kanji": "不死鳥", "sub_jp": "フェニックス // DUELIST", "color": "#ff4655", "accent": "rgba(255, 70, 85, 0.4)", "bg_kanji": "炎"},
    "yoru": {"portrait": "https://media.valorant-api.com/agents/7f94d92c-4234-0a36-9646-3a87eb8b5c89/fullportrait.png", "quote_en": "I'll tear through their reality.", "quote_jp": "次元を切り裂く…油断するなよ。", "kanji": "夜叉", "sub_jp": "ヨル // DUELIST", "color": "#3b82f6", "accent": "rgba(59, 130, 246, 0.4)", "bg_kanji": "裂"},
    "neon": {"portrait": "https://media.valorant-api.com/agents/bb2a4828-46eb-8cd1-e765-15848195d751/fullportrait.png", "quote_en": "Move or get zapped! Full speed!", "quote_jp": "電光石火！追いつけるかな？", "kanji": "雷電", "sub_jp": "ネオン // DUELIST", "color": "#00e5ff", "accent": "rgba(0, 229, 255, 0.4)", "bg_kanji": "雷"},
    "iso": {"portrait": "https://media.valorant-api.com/agents/0e38b510-41a8-5780-5e8f-568b2a4f2d6c/fullportrait.png", "quote_en": "Step into my arena. One on one.", "quote_jp": "領域展開…一対一の勝負だ。", "kanji": "領域", "sub_jp": "アイソ // DUELIST", "color": "#a855f7", "accent": "rgba(168, 85, 247, 0.4)", "bg_kanji": "闘"},
    "omen": {"portrait": "https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/fullportrait.png", "quote_en": "I am everywhere. Scatter!", "quote_jp": "影は至る所に…散り散りになれ。", "kanji": "暗影", "sub_jp": "オーメン // CONTROLLER", "color": "#818cf8", "accent": "rgba(129, 140, 248, 0.4)", "bg_kanji": "影"},
    "clove": {"portrait": "https://media.valorant-api.com/agents/1dbf2edd-4729-0984-3115-daa5eed44993/fullportrait.png", "quote_en": "Death is just a breather, pet.", "quote_jp": "死ぬなんてちょっとした休憩さ。", "kanji": "不死蝶", "sub_jp": "クローヴ // CONTROLLER", "color": "#f472b6", "accent": "rgba(244, 114, 182, 0.4)", "bg_kanji": "蝶"},
    "viper": {"portrait": "https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494859/fullportrait.png", "quote_en": "Welcome to my world. Don't breathe.", "quote_jp": "私の世界へようこそ…息を殺しなさい。", "kanji": "劇毒", "sub_jp": "ヴァイパー // CONTROLLER", "color": "#10b981", "accent": "rgba(16, 185, 129, 0.4)", "bg_kanji": "毒"},
    "brimstone": {"portrait": "https://media.valorant-api.com/agents/9f0d8ba9-4140-b941-57d3-a7ad57c6b417/fullportrait.png", "quote_en": "Open up the sky! Tactical strike ready.", "quote_jp": "天を裂け！軌道爆撃準備完了。", "kanji": "砲撃", "sub_jp": "ブリムストーン // CONTROLLER", "color": "#f97316", "accent": "rgba(249, 115, 22, 0.4)", "bg_kanji": "撃"},
    "astra": {"portrait": "https://media.valorant-api.com/agents/41fb69c1-4189-7b37-f117-bcaf1e96f1bf/fullportrait.png", "quote_en": "The stars align. Cosmic rift engaged.", "quote_jp": "星々の導き…宇宙を操る。", "kanji": "星辰", "sub_jp": "アストラ // CONTROLLER", "color": "#c084fc", "accent": "rgba(192, 132, 252, 0.4)", "bg_kanji": "星"},
    "harbor": {"portrait": "https://media.valorant-api.com/agents/95b78ed7-4637-86d9-7e41-71ba8c293152/fullportrait.png", "quote_en": "Tide's rising! High water coming through.", "quote_jp": "激流を止めることはできん！", "kanji": "激流", "sub_jp": "ハーバー // CONTROLLER", "color": "#06b6d4", "accent": "rgba(6, 182, 212, 0.4)", "bg_kanji": "波"},
    "sova": {"portrait": "https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/fullportrait.png", "quote_en": "I am the hunter! Nowhere to run.", "quote_jp": "逃げ場はない…私が狩人だ。", "kanji": "狩猟", "sub_jp": "ソーヴァ // INITIATOR", "color": "#38bdf8", "accent": "rgba(56, 189, 248, 0.4)", "bg_kanji": "狩"},
    "fade": {"portrait": "https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/fullportrait.png", "quote_en": "Face your fear. I see your nightmares.", "quote_jp": "悪夢を見せてあげる…恐怖に震えなさい。", "kanji": "悪夢", "sub_jp": "フェイド // INITIATOR", "color": "#64748b", "accent": "rgba(100, 116, 139, 0.4)", "bg_kanji": "夢"},
    "gekko": {"portrait": "https://media.valorant-api.com/agents/e370fa57-4757-3604-3648-499e1f642d3f/fullportrait.png", "quote_en": "Vámonos! Let's get 'em, crew!", "quote_jp": "行くぞ仲間たち！派手にかまそう！", "kanji": "怪獣", "sub_jp": "ゲッコー // INITIATOR", "color": "#a3e635", "accent": "rgba(163, 230, 53, 0.4)", "bg_kanji": "獣"},
    "skye": {"portrait": "https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/fullportrait.png", "quote_en": "Hawk out! Good on ya, team!", "quote_jp": "ホーク・アウト！自然の力を見よ！", "kanji": "鷹翔", "sub_jp": "スカイ // INITIATOR", "color": "#22c55e", "accent": "rgba(34, 197, 94, 0.4)", "bg_kanji": "鷹"},
    "breach": {"portrait": "https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-13acf203c006/fullportrait.png", "quote_en": "Let's make some noise! Rolling thunder!", "quote_jp": "衝撃に備えろ！吹き飛ばしてやる！", "kanji": "震盪", "sub_jp": "ブリーチ // INITIATOR", "color": "#ea580c", "accent": "rgba(234, 88, 12, 0.4)", "bg_kanji": "震"},
    "kay/o": {"portrait": "https://media.valorant-api.com/agents/601dbbe7-43ce-be57-2a40-4abd24953621/fullportrait.png", "quote_en": "No one walks away. Neutralizing radiants.", "quote_jp": "無力化完了…誰も逃がさない。", "kanji": "殲滅", "sub_jp": "ケイ／オー // INITIATOR", "color": "#64748b", "accent": "rgba(100, 116, 139, 0.4)", "bg_kanji": "機"},
    "cypher": {"portrait": "https://media.valorant-api.com/agents/117ed9e3-49f3-6512-3ccf-0cada7e3823b/fullportrait.png", "quote_en": "I know exactly where you are. I see all.", "quote_jp": "どこに隠れても無駄だ…全て見えている。", "kanji": "全視", "sub_jp": "サイファー // SENTINEL", "color": "#e2e8f0", "accent": "rgba(226, 232, 240, 0.4)", "bg_kanji": "眼"},
    "killjoy": {"portrait": "https://media.valorant-api.com/agents/1e58de9c-4950-5125-93e9-a0aee9f98746/fullportrait.png", "quote_en": "Don't stress, I've already calculated everything.", "quote_jp": "計算通り…私の発明は完璧よ！", "kanji": "工学", "sub_jp": "キルジョイ // SENTINEL", "color": "#eab308", "accent": "rgba(234, 179, 8, 0.4)", "bg_kanji": "智"},
    "chamber": {"portrait": "https://media.valorant-api.com/agents/22697a3d-45bf-8dd7-4fec-84a9e28c69d7/fullportrait.png", "quote_en": "You want to play? Let's play. Precision counts.", "quote_jp": "遊びたいのかい？一流の技術を見せよう。", "kanji": "金華", "sub_jp": "チェンバー // SENTINEL", "color": "#fbbf24", "accent": "rgba(251, 191, 36, 0.4)", "bg_kanji": "銃"},
    "sage": {"portrait": "https://media.valorant-api.com/agents/569fdd95-4d10-43ab-ca70-79becc718b46/fullportrait.png", "quote_en": "You will not die here. I am both shield and sword.", "quote_jp": "ここでは死なせない…私が守る。", "kanji": "再生", "sub_jp": "セージ // SENTINEL", "color": "#2dd4bf", "accent": "rgba(45, 212, 191, 0.4)", "bg_kanji": "癒"},
    "deadlock": {"portrait": "https://media.valorant-api.com/agents/cc8b64c8-4b25-4ff9-6e7f-37b4da43d235/fullportrait.png", "quote_en": "Death to the intruders. Nanowire armed.", "quote_jp": "侵入者を撃滅せよ…封鎖完了。", "kanji": "封鎖", "sub_jp": "デッドロック // SENTINEL", "color": "#93c5fd", "accent": "rgba(147, 197, 253, 0.4)", "bg_kanji": "鎖"},
    "vyse": {"portrait": "https://media.valorant-api.com/agents/efba5359-4016-a1e5-7626-b1ae76895940/fullportrait.png", "quote_en": "Liquid metal bends to my will. Disarm them.", "quote_jp": "液体金属の檻…武器を捨てなさい。", "kanji": "鋼鉄", "sub_jp": "ヴァイス // SENTINEL", "color": "#94a3b8", "accent": "rgba(148, 163, 184, 0.4)", "bg_kanji": "鋼"}
}

KINETIC_CARD_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@500;700;900&family=Syncopate:wght@700&family=Teko:wght@600;700&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    background: transparent;
    font-family: 'Noto Sans JP', 'Syncopate', sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    overflow: hidden;
}
.canvas-container {
    width: 100%;
    height: 590px;
    max-width: 1160px;
    display: grid;
    grid-template-columns: 46% 40% 14%;
    background: #07070a;
    background-image: radial-gradient(circle at 60% 40%, rgba(25, 20, 28, 0.95) 0%, #060608 100%);
    position: relative;
    box-shadow: 
        0 25px 70px rgba(0, 0, 0, 0.85),
        inset 0 0 60px rgba(6, 6, 8, 0.9),
        inset 0 0 120px rgba(0, 0, 0, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    overflow: hidden;
}
.canvas-container::after {
    content: '';
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background: radial-gradient(circle, transparent 45%, rgba(6, 6, 8, 0.85) 100%);
    z-index: 12;
    pointer-events: none;
}
.canvas-dot-overlay {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    background-image: radial-gradient(rgba(255, 255, 255, 0.05) 15%, transparent 16%);
    background-size: 6px 6px;
    z-index: 2;
    pointer-events: none;
}
.ui-corner-bracket {
    position: absolute;
    width: 16px;
    height: 16px;
    border: 2px solid __COLOR__;
    z-index: 13;
    pointer-events: none;
    opacity: 0.6;
}
.top-left { top: 20px; left: 20px; border-right: none; border-bottom: none; }
.bottom-right { bottom: 20px; right: 20px; border-left: none; border-top: none; }

.nihility-bg-text {
    position: absolute;
    width: 260%;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
    font-family: 'Syncopate', sans-serif;
    font-size: 10.5rem;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.02);
    letter-spacing: 24px;
    white-space: nowrap;
    z-index: 1;
    pointer-events: none;
    user-select: none;
    animation: move-nihility 40s linear infinite;
}
#petals-canvas {
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    z-index: 11;
    pointer-events: none;
}

.left-panel {
    padding: 26px 30px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    z-index: 5;
    background: linear-gradient(90deg, rgba(6, 6, 8, 0.98) 0%, rgba(18, 10, 15, 0.75) 80%, rgba(0, 0, 0, 0) 100%);
}
.hero-quote-header {
    font-size: 0.72rem;
    font-weight: 900;
    color: #cbd5e1;
    letter-spacing: 2px;
    line-height: 1.4;
    text-transform: uppercase;
    border-left: 3px solid __COLOR__;
    padding-left: 10px;
}
.quote-jp {
    font-size: 0.62rem;
    color: #94a3b8;
    display: block;
    margin-top: 3px;
    letter-spacing: 1px;
}
.main-title-group {
    position: relative;
    margin-top: 10px;
}
.japanese-sub {
    font-size: 0.85rem;
    color: __COLOR__;
    font-weight: 900;
    letter-spacing: 5px;
    margin-bottom: 2px;
    display: block;
    text-shadow: 0 0 10px __ACCENT__;
}
.player-hero-name {
    font-family: 'Teko', sans-serif;
    font-size: 4.6rem;
    font-weight: 700;
    color: #ffffff;
    line-height: 0.88;
    letter-spacing: 2px;
    text-transform: uppercase;
    display: inline-block;
    text-shadow: 1px 1px 0px rgba(0,0,0,0.8), 0 0 25px __ACCENT__;
}
.player-tag {
    font-family: 'Teko', sans-serif;
    font-size: 2.2rem;
    color: #ff4655;
    margin-left: 6px;
}
.badges-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
    flex-wrap: wrap;
}
.numeric-badge {
    display: inline-block;
    background: #ffffff;
    color: #060608;
    padding: 3px 12px;
    font-size: 0.72rem;
    font-weight: 900;
    letter-spacing: 2px;
    border-radius: 2px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.5);
}
.rank-badge {
    background: rgba(255, 70, 85, 0.2);
    border: 1px solid #ff4655;
    color: #ff4655;
    padding: 3px 10px;
    font-size: 0.7rem;
    font-weight: 800;
    letter-spacing: 2px;
    border-radius: 2px;
}

.tactical-hud {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-top: 14px;
    background: rgba(12, 14, 20, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 6px;
    padding: 10px 12px;
    backdrop-filter: blur(8px);
}
.hud-item { text-align: center; }
.hud-label {
    font-size: 0.58rem;
    color: #94a3b8;
    letter-spacing: 1px;
    text-transform: uppercase;
}
.hud-value {
    font-family: 'Teko', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #ffffff;
    line-height: 1.1;
}

.music-player {
    background: rgba(10, 10, 14, 0.75);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 10px 14px;
    margin-top: 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    backdrop-filter: blur(12px);
    border-radius: 6px;
    transition: border-color 0.3s ease;
}
.music-player.is-playing {
    border-color: __COLOR__;
    box-shadow: 0 0 15px __ACCENT__;
}
.player-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.track-title {
    font-size: 0.63rem;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    width: 65%;
}
.time-display {
    font-size: 0.6rem;
    font-family: monospace;
    color: #94a3b8;
}
.progress-container {
    width: 100%;
    height: 3px;
    background: rgba(255, 255, 255, 0.08);
    position: relative;
    cursor: pointer;
    border-radius: 2px;
}
.progress-bar {
    height: 100%;
    width: 0%;
    background: linear-gradient(90deg, __COLOR__, #ffffff);
    position: absolute;
    top: 0; left: 0;
    border-radius: 2px;
    box-shadow: 0 0 8px __COLOR__;
}
.player-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
}
.play-btn {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: #ffffff;
    padding: 3px 14px;
    font-size: 0.6rem;
    font-weight: 900;
    letter-spacing: 2px;
    cursor: pointer;
    text-transform: uppercase;
    border-radius: 20px;
    transition: all 0.25s ease;
}
.play-btn:hover { background: #ffffff; color: #060608; }
.volume-container { display: flex; align-items: center; gap: 6px; }
.volume-label { font-size: 0.52rem; color: #64748b; font-family: monospace; }
.volume-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 55px;
    height: 3px;
    background: rgba(255, 255, 255, 0.12);
    outline: none;
    border-radius: 2px;
    cursor: pointer;
}
.volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 8px;
    height: 8px;
    background: __COLOR__;
    border-radius: 50%;
}
.left-footer {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding-top: 10px;
    margin-top: 8px;
}
.game-meta { font-size: 0.58rem; color: #64748b; font-weight: 700; letter-spacing: 2px; }
.tag-pill {
    background: transparent;
    border: 1px solid __COLOR__;
    color: __COLOR__;
    padding: 3px 10px;
    font-size: 0.56rem;
    font-weight: 900;
    letter-spacing: 2px;
    border-radius: 2px;
}

.center-panel {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 4;
}
.art-window {
    width: 92%;
    height: 90%;
    position: relative;
    overflow: hidden;
    border-radius: 6px;
    background: linear-gradient(135deg, rgba(20, 30, 35, 0.1) 0%, rgba(10, 15, 20, 0.4) 100%);
    border: 1px solid rgba(255, 255, 255, 0.06);
}
.art-window::after {
    content: '';
    position: absolute;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, __COLOR__, rgba(255,255,255,0.7), __COLOR__, transparent);
    top: 0; z-index: 2;
    animation: laser-scan 4s linear infinite;
}
.large-bg-kanji {
    font-size: 15rem;
    color: rgba(255, 255, 255, 0.025);
    position: absolute;
    top: -30px; left: -20px;
    font-weight: 900;
    z-index: 2;
    user-select: none;
    line-height: 1;
}
.tech-overlay {
    position: absolute;
    right: 18px; top: 20%;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
    color: rgba(255, 255, 255, 0.35);
    font-size: 0.52rem;
    font-family: monospace;
    z-index: 3;
}
.live-pulse-bar {
    width: 35px;
    height: 2px;
    background-color: __COLOR__;
    animation: bar-stretch 1.2s infinite ease-in-out;
}
.character-root {
    position: absolute;
    width: 135%;
    height: 110%;
    bottom: 0%;
    left: -18%;
    z-index: 10;
    pointer-events: none;
    transition: transform 0.4s cubic-bezier(0.25, 1, 0.5, 1);
    will-change: transform;
}
.character-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: bottom center;
    filter: drop-shadow(0 15px 35px rgba(0, 0, 0, 0.9)) drop-shadow(0 0 45px __ACCENT__);
    animation: float-character 6s ease-in-out infinite;
}

.right-panel {
    padding: 26px 12px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    color: #ffffff;
    position: relative;
    z-index: 15;
    background: linear-gradient(-90deg, rgba(6, 6, 8, 0.6) 0%, transparent 100%);
}
.pill-box {
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 0.58rem;
    letter-spacing: 2px;
    font-weight: bold;
    background: rgba(255,255,255,0.03);
}
.vertical-text-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}
.v-kanji-title {
    writing-mode: vertical-rl;
    font-size: 1.9rem;
    font-weight: 900;
    letter-spacing: 8px;
    color: #ffffff;
    text-shadow: 0 4px 10px rgba(0,0,0,0.7);
}
.v-latin-sub {
    writing-mode: vertical-rl;
    font-size: 0.62rem;
    letter-spacing: 4px;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
}
.diamond {
    color: __COLOR__;
    font-size: 0.72rem;
    animation: pulse-glow 2s infinite ease-in-out;
}
.panel-footer-stamp { text-align: center; }
.micro-japanese {
    font-size: 0.44rem;
    letter-spacing: 3px;
    color: rgba(255, 255, 255, 0.35);
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    margin-top: 6px;
}

@keyframes move-nihility { 0% { transform: translate(0, -50%); } 100% { transform: translate(-50%, -50%); } }
@keyframes float-character { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
@keyframes laser-scan { 0% { top: 0%; opacity: 0; } 5%, 95% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
@keyframes bar-stretch { 0%, 100% { width: 15px; } 50% { width: 45px; } }
@keyframes pulse-glow { 0%, 100% { opacity: 0.3; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.1); } }
</style>
</head>
<body>
<div class="canvas-container" id="main-canvas">
    <div class="canvas-dot-overlay"></div>
    <div class="ui-corner-bracket top-left"></div>
    <div class="ui-corner-bracket bottom-right"></div>
    <div class="nihility-bg-text">VALORANT PROTOCOL RADIANT GAME DRIFTERS INTELLECTUAL</div>
    <canvas id="petals-canvas"></canvas>

    <section class="left-panel">
        <div class="hero-quote-header">
            __QUOTE_EN__
            <span class="quote-jp">__QUOTE_JP__</span>
        </div>

        <div class="main-title-group">
            <span class="japanese-sub">__SUB_JP__</span>
            <div style="display:flex;align-items:baseline;">
                <h1 class="player-hero-name">__PLAYER_NAME__</h1>
                <span class="player-tag">__RIOT_TAG__</span>
            </div>
            
            <div class="badges-row">
                <div class="numeric-badge">RANK #__RANK_NUM__ / __TOTAL_PLAYERS__</div>
                <div class="rank-badge">__TIER__-TIER // __RATING__ OVR</div>
            </div>

            <div class="tactical-hud">
                <div class="hud-item">
                    <div class="hud-label">ACS</div>
                    <div class="hud-value">__ACS__</div>
                </div>
                <div class="hud-item">
                    <div class="hud-label">K/D</div>
                    <div class="hud-value">__KD__</div>
                </div>
                <div class="hud-item">
                    <div class="hud-label">HS%</div>
                    <div class="hud-value">__HS__</div>
                </div>
                <div class="hud-item">
                    <div class="hud-label">FORM</div>
                    <div class="hud-value">__FORM__</div>
                </div>
            </div>

            <div class="music-player" id="player-card">
                <audio id="audio-element" src="https://www.dropbox.com/scl/fi/ersb17v6uwmcelmvapgxp/Fall-To-Hell-DOLLWAVE-Darkwave-Lyrics-visualizer.mp3?rlkey=3pfivpdswvsnwxwzqnix01wnl&st=vs1tmdms&dl=1"></audio>
                <div class="player-info">
                    <span class="track-title" id="track-name">Fall To Hell - DOLLWAVE // ANTHEM</span>
                    <span class="time-display" id="time-track">0:00 / 0:00</span>
                </div>
                <div class="progress-container" id="progress-cont">
                    <div class="progress-bar" id="progress-actual"></div>
                </div>
                <div class="player-controls">
                    <button class="play-btn" id="play-trigger">Play</button>
                    <div class="volume-container">
                        <span class="volume-label">VOL</span>
                        <input type="range" class="volume-slider" id="vol-slider" min="0" max="1" step="0.05" value="0.5">
                    </div>
                </div>
            </div>
        </div>

        <div class="left-footer">
            <p class="game-meta">OVERDRIVE MODE // PROTOCOL: STABLE</p>
            <div class="tag-pill">__ROLE__</div>
        </div>
    </section>

    <section class="center-panel">
        <div class="art-window">
            <span class="large-bg-kanji">__BG_KANJI__</span>
            <div class="tech-overlay">
                <span>STATUS: COMBAT_READY</span>
                <span>SIGNATURE: RADIANT_SYNC</span>
                <div class="live-pulse-bar"></div>
            </div>
        </div>
        <div class="character-root" id="character-layer">
            <img src="__AGENT_PORTRAIT__" alt="__AGENT_NAME__" class="character-img">
        </div>
    </section>

    <aside class="right-panel">
        <div class="pill-box">GAME DRIFTERS</div>
        <div class="vertical-text-wrap">
            <span class="v-kanji-title">__KANJI__</span>
            <span class="v-latin-sub">__AGENT_NAME__</span>
            <span class="diamond">✦</span>
            <span class="v-latin-sub">__ROLE__</span>
        </div>
        <div class="panel-footer-stamp">
            <div style="color: rgba(255,255,255,0.2); font-size: 10px;">—</div>
            <p class="micro-japanese">システム起動完了</p>
        </div>
    </aside>
</div>

<script>
    const mainCanvas = document.getElementById('main-canvas');
    const charLayer = document.getElementById('character-layer');
    const audio = document.getElementById('audio-element');
    const playBtn = document.getElementById('play-trigger');
    const playerCard = document.getElementById('player-card');
    const progressContainer = document.getElementById('progress-cont');
    const progressBar = document.getElementById('progress-actual');
    const timeDisplay = document.getElementById('time-track');
    const volumeSlider = document.getElementById('vol-slider');

    let mouseX = 0, mouseY = 0;
    let charX = 0, charY = 0;
    let petalsParamX = 0;

    document.addEventListener('mousemove', (e) => {
        const rect = mainCanvas.getBoundingClientRect();
        mouseX = ((e.clientX - rect.left) - rect.width / 2) / (rect.width / 2);
        mouseY = ((e.clientY - rect.top) - rect.height / 2) / (rect.height / 2);
    });

    function updateParallax() {
        const targetX = mouseX * 22;
        const targetY = mouseY * 14;
        charX += (targetX - charX) * 0.08;
        charY += (targetY - charY) * 0.08;
        petalsParamX += (-mouseX * 12 - petalsParamX) * 0.05;
        charLayer.style.transform = `translate(${charX}px, ${charY}px)`;
        requestAnimationFrame(updateParallax);
    }
    updateParallax();

    const petalCanvas = document.getElementById('petals-canvas');
    const ctx = petalCanvas.getContext('2d');

    function resizeCanvas() {
        petalCanvas.width = mainCanvas.clientWidth;
        petalCanvas.height = mainCanvas.clientHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    setTimeout(resizeCanvas, 100);

    const petalsArray = [];
    const maxPetals = 32;
    const accentCol = "__COLOR__";

    class RadiantEmber {
        constructor() {
            this.x = Math.random() * (petalCanvas.width || 800);
            this.y = Math.random() * (petalCanvas.height || 600);
            this.size = Math.random() * 4 + 2;
            this.speedY = Math.random() * 0.7 + 0.3;
            this.speedX = Math.random() * 0.4 - 0.2;
            this.angle = Math.random() * 360;
            this.spin = Math.random() * 0.8 - 0.4;
            this.alpha = Math.random() * 0.4 + 0.2;
        }
        update() {
            this.y -= this.speedY;
            this.x += this.speedX + Math.sin(this.y / 35) * 0.3 + (petalsParamX * 0.03);
            this.angle += this.spin;
            if (this.y < -10) {
                this.y = (petalCanvas.height || 600) + 10;
                this.x = Math.random() * (petalCanvas.width || 800);
            }
        }
        draw() {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate((this.angle * Math.PI) / 180);
            ctx.fillStyle = accentCol;
            ctx.globalAlpha = this.alpha;
            ctx.shadowBlur = 8;
            ctx.shadowColor = accentCol;
            
            ctx.beginPath();
            ctx.moveTo(0, -this.size);
            ctx.lineTo(this.size * 0.6, 0);
            ctx.lineTo(0, this.size);
            ctx.lineTo(-this.size * 0.6, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        }
    }

    for (let i = 0; i < maxPetals; i++) {
        petalsArray.push(new RadiantEmber());
    }

    function animatePetals() {
        ctx.clearRect(0, 0, petalCanvas.width, petalCanvas.height);
        for (let i = 0; i < petalsArray.length; i++) {
            petalsArray[i].update();
            petalsArray[i].draw();
        }
        requestAnimationFrame(animatePetals);
    }
    animatePetals();

    audio.volume = volumeSlider.value;
    playBtn.addEventListener('click', () => {
        if (audio.paused) {
            audio.play().catch(() => {});
            playBtn.textContent = 'Pause';
            playerCard.classList.add('is-playing');
        } else {
            audio.pause();
            playBtn.textContent = 'Play';
            playerCard.classList.remove('is-playing');
        }
    });

    function formatTime(secs) {
        if (isNaN(secs)) return "0:00";
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    audio.addEventListener('timeupdate', () => {
        if (audio.duration) {
            const percent = (audio.currentTime / audio.duration) * 100;
            progressBar.style.width = `${percent}%`;
            timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
        }
    });

    audio.addEventListener('loadedmetadata', () => {
        timeDisplay.textContent = `0:00 / ${formatTime(audio.duration)}`;
    });

    progressContainer.addEventListener('click', (e) => {
        const rect = progressContainer.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        audio.currentTime = (clickX / rect.width) * audio.duration;
    });

    volumeSlider.addEventListener('input', (e) => {
        audio.volume = e.target.value;
    });

    audio.addEventListener('ended', () => {
        playBtn.textContent = 'Play';
        progressBar.style.width = '0%';
        playerCard.classList.remove('is-playing');
    });
</script>
</body>
</html>"""

def render_kinetic_player_card(player, norm_df, player_data, career, form, consistency, impact, kd, hs):
    if "#" in str(player):
        p_parts = str(player).split("#")
        p_name = p_parts[0].strip()
        p_tag = "#" + p_parts[1].strip()
    else:
        p_name = str(player)
        p_tag = ""

    agent_series = player_data["Agent"].dropna() if "Agent" in player_data.columns else pd.Series()
    agent_name = str(agent_series.iloc[-1]).lower().strip() if len(agent_series) > 0 else "jett"

    role_series = player_data["Role"].dropna() if "Role" in player_data.columns else pd.Series()
    role_name = str(role_series.iloc[-1]).strip() if len(role_series) > 0 else "Duelist"

    prof = AGENT_PROFILES.get(agent_name, AGENT_PROFILES.get("jett"))
    roster_ranks = norm_df.groupby("Player")["Overall"].mean().sort_values(ascending=False).index.tolist()
    rank_num = roster_ranks.index(player) + 1 if player in roster_ranks else 1
    total_players = len(roster_ranks)

    ovr = career if pd.notna(career) else 0.0
    tier = "S" if ovr >= 9 else "A" if ovr >= 8 else "B" if ovr >= 7 else "C"

    acs_val = player_data["ACS"].mean() if "ACS" in player_data.columns else 0.0
    acs_str = f"{acs_val:.1f}" if pd.notna(acs_val) else "—"
    kd_str = f"{kd:.2f}" if pd.notna(kd) else "—"
    hs_str = f"{hs:.1f}%" if pd.notna(hs) else "—"
    form_str = f"{form:.2f}" if pd.notna(form) else "—"
    rating_str = f"{ovr:.2f}"

    html = (
        KINETIC_CARD_TEMPLATE
        .replace("__PLAYER_NAME__", p_name)
        .replace("__RIOT_TAG__", p_tag)
        .replace("__AGENT_NAME__", agent_name.upper())
        .replace("__AGENT_PORTRAIT__", prof["portrait"])
        .replace("__QUOTE_EN__", prof["quote_en"])
        .replace("__QUOTE_JP__", prof["quote_jp"])
        .replace("__KANJI__", prof["kanji"])
        .replace("__SUB_JP__", prof["sub_jp"])
        .replace("__ROLE__", role_name.upper())
        .replace("__TIER__", tier)
        .replace("__RATING__", rating_str)
        .replace("__RANK_NUM__", str(rank_num))
        .replace("__TOTAL_PLAYERS__", str(total_players))
        .replace("__ACS__", acs_str)
        .replace("__KD__", kd_str)
        .replace("__HS__", hs_str)
        .replace("__FORM__", form_str)
        .replace("__COLOR__", prof["color"])
        .replace("__ACCENT__", prof["accent"])
        .replace("__BG_KANJI__", prof["bg_kanji"])
    )
    components.html(html, height=615, scrolling=False)

# =========================================================
# PLOTLY THEME HELPER
# =========================================================
def apply_vct_theme(fig, title=""):
    fig.update_layout(
        title=dict(
            text=f"<b>{title.upper()}</b>" if title else "",
            font=dict(family="Teko, sans-serif", size=22, color="#ff4655")
        ),
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font=dict(family="Inter, sans-serif", color="#cbd5e1", size=11),
        xaxis=dict(
            gridcolor="rgba(255,255,255,0.06)",
            zerolinecolor="rgba(255,70,85,0.2)",
            tickfont=dict(size=11, color="#94a3b8")
        ),
        yaxis=dict(
            gridcolor="rgba(255,255,255,0.06)",
            zerolinecolor="rgba(255,70,85,0.2)",
            tickfont=dict(size=11, color="#94a3b8")
        ),
        legend=dict(
            bgcolor="rgba(12,14,20,0.6)",
            bordercolor="rgba(255,255,255,0.1)",
            font=dict(size=10)
        ),
        margin=dict(l=35, r=35, t=45, b=35)
    )
    return fig

# =========================================================
# EXECUTIVE KPI STRIP
# =========================================================
avg_team_kd = df["KD"].mean() if "KD" in df.columns else 1.0
avg_team_acs = df["ACS"].mean() if "ACS" in df.columns else 200.0
total_players = len(norm["Player"].dropna().unique())
top_player_series = norm.groupby("Player")["Overall"].mean().sort_values(ascending=False)
mvp_player = top_player_series.index[0] if len(top_player_series) > 0 else "N/A"
mvp_score = top_player_series.iloc[0] if len(top_player_series) > 0 else 0.0

st.markdown(f"""
<div class="kpi-container">
    <div class="kpi-box">
        <div class="kpi-label">ACTIVE SQUAD</div>
        <div class="kpi-val">{total_players} PLAYERS</div>
        <div class="kpi-sub">Competitive Roster Synchronized</div>
    </div>
    <div class="kpi-box">
        <div class="kpi-label">ROSTER MVP</div>
        <div class="kpi-val">{mvp_player.split('#')[0]}</div>
        <div class="kpi-sub">Overall Rating: <b style="color:#fbbf24">{mvp_score:.2f} / 10</b></div>
    </div>
    <div class="kpi-box">
        <div class="kpi-label">SQUAD AVERAGE ACS</div>
        <div class="kpi-val">{avg_team_acs:.1f}</div>
        <div class="kpi-sub">Benchmarked Combat Score</div>
    </div>
    <div class="kpi-box">
        <div class="kpi-label">SQUAD AVERAGE K/D</div>
        <div class="kpi-val">{avg_team_kd:.2f}</div>
        <div class="kpi-sub">Kill/Death Elimination Ratio</div>
    </div>
</div>
""", unsafe_allow_html=True)

# =========================================================
# TACTICAL TABS NAVIGATION
# =========================================================
tab_overview, tab_player, tab_team, tab_archives = st.tabs([
    "⚡ COMMAND CENTER",
    "🎯 OPERATIVE DOSSIER",
    "📊 TEAM TELEMETRY",
    "📜 MATCH ARCHIVES"
])

# =========================================================
# TAB 1: COMMAND CENTER (OVERVIEW)
# =========================================================
with tab_overview:
    c_left, c_right = st.columns([7, 5])

    with c_left:
        st.markdown('<div class="hud-card"><div class="hud-title">⭐ Squad Leaderboard <span>Ranked Performance Index</span></div>', unsafe_allow_html=True)
        
        rankings = norm.groupby("Player").agg({
            "Overall": "mean",
            "KD": "mean",
            "ACS": "mean",
            "HS%": "mean"
        }).sort_values(by=["Overall", "KD", "ACS"], ascending=False)

        for i, (p_name, row) in enumerate(rankings.iterrows(), 1):
            s = row["Overall"]
            tier = "S" if s >= 9 else "A" if s >= 8 else "B" if s >= 7 else "C"
            tier_cls = f"tier-{tier.lower()}"
            agent_s = df[df["Player"] == p_name]["Agent"].dropna()
            agent_val = agent_s.iloc[-1] if len(agent_s) else "jett"
            img_url = agent_img(agent_val)
            role_s = df[df["Player"] == p_name]["Role"].dropna()
            role_val = role_s.iloc[-1] if len(role_s) else "Duelist"
            role_cls = f"badge-{role_val.lower()}"
            is_mvp = "mvp-row" if i == 1 else ""

            st.markdown(f"""
            <div class="leader-row {is_mvp}">
                <div class="leader-left">
                    <div class="leader-rank">#{i}</div>
                    <img src="{img_url}" class="leader-avatar">
                    <div class="leader-info">
                        <b>{p_name}</b> <span class="badge-role {role_cls}">{role_val}</span><br>
                        <span style="font-size:11px;color:#94a3b8;">Main Agent: {str(agent_val).upper()}</span>
                    </div>
                </div>
                <div class="leader-stats">
                    <div class="leader-stat-box">
                        <div class="leader-stat-lbl">ACS</div>
                        <div class="leader-stat-val">{row['ACS']:.0f}</div>
                    </div>
                    <div class="leader-stat-box">
                        <div class="leader-stat-lbl">K/D</div>
                        <div class="leader-stat-val">{row['KD']:.2f}</div>
                    </div>
                    <div class="leader-stat-box">
                        <div class="leader-stat-lbl">HS%</div>
                        <div class="leader-stat-val">{row['HS%']:.1f}%</div>
                    </div>
                    <div class="tier-pill {tier_cls}">{tier} ({s:.2f})</div>
                </div>
            </div>
            """, unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)

    with c_right:
        # ROLE CHAMPIONS
        st.markdown('<div class="hud-card"><div class="hud-title">👑 Role Champions <span>Benchmark Leaders</span></div>', unsafe_allow_html=True)
        role_best = norm.groupby(["Role", "Player"])["Overall"].mean().reset_index()
        if not role_best.empty:
            role_best = role_best.loc[role_best.groupby("Role")["Overall"].idxmax()]
            for _, r_row in role_best.iterrows():
                r_agent_s = df[df["Player"] == r_row["Player"]]["Agent"].dropna()
                r_agent = r_agent_s.iloc[-1] if len(r_agent_s) else "jett"
                r_img = agent_img(r_agent)
                r_cls = f"badge-{str(r_row['Role']).lower()}"
                st.markdown(f"""
                <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);padding:10px 14px;border-radius:8px;margin-bottom:10px;">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <img src="{r_img}" style="width:40px;height:40px;border-radius:6px;object-fit:cover;">
                        <div>
                            <span class="badge-role {r_cls}">{r_row['Role']}</span>
                            <div style="color:white;font-weight:700;font-size:15px;margin-top:2px;">{r_row['Player']}</div>
                        </div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-family:'Teko',sans-serif;font-size:26px;color:#ff4655;font-weight:700;line-height:1;">{r_row['Overall']:.2f}</div>
                        <div style="font-size:10px;color:#94a3b8;letter-spacing:1px;">RATING</div>
                    </div>
                </div>
                """, unsafe_allow_html=True)
        st.markdown('</div>', unsafe_allow_html=True)

        # ROLE OVERALL COMPARISON BAR
        st.markdown('<div class="hud-card"><div class="hud-title">⚡ Squad Role Power <span>Average Rating per Role</span></div>', unsafe_allow_html=True)
        role_avg = norm.groupby("Role")["Overall"].mean().reset_index()
        fig_role_ov = px.bar(
            role_avg,
            x="Role",
            y="Overall",
            color="Overall",
            color_continuous_scale=[[0, "#3b82f6"], [0.5, "#ff4655"], [1, "#fbbf24"]]
        )
        apply_vct_theme(fig_role_ov)
        fig_role_ov.update_layout(height=260, yaxis=dict(range=[0, 10]), coloraxis_showscale=False)
        st.plotly_chart(fig_role_ov, width="stretch")
        st.markdown('</div>', unsafe_allow_html=True)

# =========================================================
# TAB 2: OPERATIVE DOSSIER (PLAYER DEEP DIVE)
# =========================================================
with tab_player:
    player = st.selectbox("SELECT OPERATIVE FOR TACTICAL ANALYSIS", norm["Player"].dropna().unique())
    player_df = norm[norm["Player"] == player]

    kd = player_df["KD"].mean()
    hs = player_df["HS%"].mean()
    pn = norm[(norm["Player"] == player) & (norm["Overall"].notna())]

    career = pn["Overall"].mean() if not pn.empty else 0.0
    form = pn.tail(3)["Overall"].mean() if not pn.empty else 0.0
    consistency = max(0, 10 - (pn["Overall"].std() * 4)) if len(pn) > 1 else 10.0
    impact = (career * 0.6) + (form * 0.25) + (consistency * 0.15)

    # 3-PANEL KINETIC SHOWCASE
    render_kinetic_player_card(player, norm, player_df, career, form, consistency, impact, kd, hs)

    # HUD METRIC GAUGES
    st.markdown('<div class="hud-card"><div class="hud-title">📊 Operative Diagnostic Metrics <span>Career Matrix (0 - 10)</span></div>', unsafe_allow_html=True)
    m1, m2, m3, m4 = st.columns(4)
    with m1:
        st.markdown(f"""
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,70,85,0.3);padding:16px;border-radius:8px;text-align:center;">
            <div style="font-family:'Syncopate',sans-serif;font-size:10px;color:#94a3b8;letter-spacing:2px;">PERFORMANCE</div>
            <div style="font-family:'Teko',sans-serif;font-size:48px;color:#ffffff;font-weight:700;line-height:1;margin:6px 0;">{career:.2f}</div>
            <div style="font-size:11px;color:#ff4655;">CAREER RATING</div>
        </div>
        """, unsafe_allow_html=True)
    with m2:
        st.markdown(f"""
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(91,248,255,0.3);padding:16px;border-radius:8px;text-align:center;">
            <div style="font-family:'Syncopate',sans-serif;font-size:10px;color:#94a3b8;letter-spacing:2px;">CONSISTENCY</div>
            <div style="font-family:'Teko',sans-serif;font-size:48px;color:#ffffff;font-weight:700;line-height:1;margin:6px 0;">{consistency:.2f}</div>
            <div style="font-size:11px;color:#5bf8ff;">MATCH STABILITY</div>
        </div>
        """, unsafe_allow_html=True)
    with m3:
        st.markdown(f"""
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(251,191,36,0.3);padding:16px;border-radius:8px;text-align:center;">
            <div style="font-family:'Syncopate',sans-serif;font-size:10px;color:#94a3b8;letter-spacing:2px;">RECENT FORM</div>
            <div style="font-family:'Teko',sans-serif;font-size:48px;color:#ffffff;font-weight:700;line-height:1;margin:6px 0;">{form:.2f}</div>
            <div style="font-size:11px;color:#fbbf24;">LAST 3 MATCH TREND</div>
        </div>
        """, unsafe_allow_html=True)
    with m4:
        st.markdown(f"""
        <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(192,132,252,0.3);padding:16px;border-radius:8px;text-align:center;">
            <div style="font-family:'Syncopate',sans-serif;font-size:10px;color:#94a3b8;letter-spacing:2px;">IMPACT VALUE</div>
            <div style="font-family:'Teko',sans-serif;font-size:48px;color:#ffffff;font-weight:700;line-height:1;margin:6px 0;">{impact:.2f}</div>
            <div style="font-size:11px;color:#c084fc;">WEIGHTED VALUE</div>
        </div>
        """, unsafe_allow_html=True)
    st.markdown('</div>', unsafe_allow_html=True)

    # RADAR & PERFORMANCE CHARTS
    st.markdown('<div class="hud-card"><div class="hud-title">📈 Tactical Skill Matrix & Trajectory</div>', unsafe_allow_html=True)
    c_rad, c_trend = st.columns([5, 7])

    with c_rad:
        radar_metrics = coach_metrics + stat_metrics
        radar_values = pn[radar_metrics].mean()
        fig_radar = go.Figure()
        fig_radar.add_trace(go.Scatterpolar(
            r=radar_values.values,
            theta=radar_metrics,
            fill="toself",
            fillcolor="rgba(255, 70, 85, 0.25)",
            line=dict(color="#ff4655", width=2),
            marker=dict(size=6, color="#ff4655")
        ))
        fig_radar.update_layout(
            polar=dict(
                radialaxis=dict(visible=True, range=[0, 10], gridcolor="rgba(255,255,255,0.1)"),
                angularaxis=dict(gridcolor="rgba(255,255,255,0.1)")
            ),
            showlegend=False,
            height=340
        )
        apply_vct_theme(fig_radar, "Hexagonal Combat Radar")
        st.plotly_chart(fig_radar, width="stretch")

    with c_trend:
        trend = history[history["Player"] == player].copy()
        if not trend.empty:
            for c in coach_metrics:
                if c in trend.columns:
                    trend[c] = pd.to_numeric(trend[c], errors="coerce")
            trend["HS_score"] = trend.apply(lambda r: rate("HS%", r["HS%"], r["Role"]), axis=1)
            trend["ACS_score"] = trend.apply(lambda r: rate("ACS", r["ACS"], r["Role"]), axis=1)
            trend["KD_score"] = trend.apply(lambda r: rate("KD", r["KD"], r["Role"]), axis=1)
            for m in coach_metrics:
                trend[m] = trend.apply(lambda r: rate(m, r[m], r["Role"]), axis=1)
            trend["CoachScore"] = trend[coach_metrics].mean(axis=1)
            trend["StatScore"] = trend[["HS_score", "ACS_score", "KD_score"]].mean(axis=1)
            trend["Overall"] = trend.apply(final_score, axis=1)
            trend = trend.sort_values("Date").tail(10)

            fig_trend = px.line(
                trend,
                x="Date",
                y="Overall",
                markers=True,
                line_shape="spline"
            )
            fig_trend.update_traces(line=dict(color="#5bf8ff", width=3), marker=dict(size=8, color="#ffffff"))
            apply_vct_theme(fig_trend, "Performance Spline (Last 10 Matches)")
            fig_trend.update_layout(height=340, yaxis=dict(range=[0, 10]))
            st.plotly_chart(fig_trend, width="stretch")
        else:
            st.info("No historical matches logged for this operative.")

    # BREAKDOWN BARS: COACH VS MECHANICAL
    b_col1, b_col2 = st.columns(2)
    with b_col1:
        coach_vals = pn[coach_metrics].mean()
        fig_coach = px.bar(
            x=coach_vals.index,
            y=coach_vals.values,
            labels={"x": "Tactical Attribute", "y": "Score"},
            color=coach_vals.values,
            color_continuous_scale=[[0, "#3b82f6"], [1, "#ff4655"]]
        )
        apply_vct_theme(fig_coach, "Coach Evaluation Metrics")
        fig_coach.update_layout(height=260, yaxis=dict(range=[0, 10]), coloraxis_showscale=False)
        st.plotly_chart(fig_coach, width="stretch")

    with b_col2:
        stat_vals = pn[stat_metrics].mean()
        fig_mech = px.bar(
            x=stat_vals.index,
            y=stat_vals.values,
            labels={"x": "Combat Metric", "y": "Score"},
            color=stat_vals.values,
            color_continuous_scale=[[0, "#10b981"], [1, "#5bf8ff"]]
        )
        apply_vct_theme(fig_mech, "Mechanical Combat Benchmarks")
        fig_mech.update_layout(height=260, yaxis=dict(range=[0, 10]), coloraxis_showscale=False)
        st.plotly_chart(fig_mech, width="stretch")

    st.markdown('</div>', unsafe_allow_html=True)

# =========================================================
# TAB 3: TEAM TELEMETRY (DEEP SQUAD ANALYTICS)
# =========================================================
with tab_team:
    st.markdown('<div class="hud-card"><div class="hud-title">🎯 Squad Combat Dispersion Matrix <span>ACS vs K/D Quadrants</span></div>', unsafe_allow_html=True)
    
    player_summary = norm.groupby(["Player", "Role"]).agg({
        "ACS": "mean",
        "KD": "mean",
        "Overall": "mean",
        "HS%": "mean"
    }).reset_index()

    fig_scatter = px.scatter(
        player_summary,
        x="ACS",
        y="KD",
        color="Role",
        size="Overall",
        hover_name="Player",
        text=player_summary["Player"].apply(lambda x: x.split("#")[0]),
        color_discrete_map={
            "Duelist": "#ff4655",
            "Controller": "#3b82f6",
            "Initiator": "#10b981",
            "Sentinel": "#f59e0b",
            "IGL": "#8b5cf6"
        }
    )
    fig_scatter.update_traces(textposition="top center", marker=dict(opacity=0.9, line=dict(width=1, color="#ffffff")))
    fig_scatter.add_hline(y=avg_team_kd, line_dash="dash", line_color="rgba(255,255,255,0.25)", annotation_text="Squad Avg KD")
    fig_scatter.add_vline(x=avg_team_acs, line_dash="dash", line_color="rgba(255,255,255,0.25)", annotation_text="Squad Avg ACS")
    apply_vct_theme(fig_scatter, "Combat Impact Matrix")
    fig_scatter.update_layout(height=480)
    st.plotly_chart(fig_scatter, width="stretch")
    st.markdown('</div>', unsafe_allow_html=True)

    # MULTI-METRIC PERFORMANCE OVER TIME
    st.markdown('<div class="hud-card"><div class="hud-title">📉 Historical Telemetry Wave <span>Tracked Match Dynamics</span></div>', unsafe_allow_html=True)
    if not history.empty:
        history_norm = history.copy()
        if "ACS" in history_norm.columns:
            history_norm["ACS_norm"] = history_norm.apply(lambda r: rate("ACS", r["ACS"], r["Role"]), axis=1)
        if "HS%" in history_norm.columns:
            history_norm["HS_norm"] = history_norm.apply(lambda r: rate("HS%", r["HS%"], r["Role"]), axis=1)
        if "KD" in history_norm.columns:
            history_norm["KD_norm"] = history_norm.apply(lambda r: rate("KD", r["KD"], r["Role"]), axis=1)

        metric_cols = ["Aim", "Utility", "Comms", "Entry", "Clutch", "HS_norm", "ACS_norm", "KD_norm"]
        avail_metrics = [m for m in metric_cols if m in history_norm.columns]
        melted = history_norm.melt(
            id_vars=["Date", "Player"],
            value_vars=avail_metrics,
            var_name="Metric",
            value_name="Score"
        ).dropna()
        melted["Metric"] = melted["Metric"].replace({"HS_norm": "HS%", "ACS_norm": "ACS", "KD_norm": "KD"})

        fig_wave = px.line(
            melted.groupby(["Date", "Metric"])["Score"].mean().reset_index(),
            x="Date",
            y="Score",
            color="Metric",
            line_shape="spline",
            markers=True
        )
        apply_vct_theme(fig_wave, "Team Average Skill Evolutions")
        fig_wave.update_layout(height=380, yaxis=dict(range=[0, 10]))
        st.plotly_chart(fig_wave, width="stretch")
    else:
        st.info("No historical archives available yet.")
    st.markdown('</div>', unsafe_allow_html=True)

# =========================================================
# TAB 4: MATCH ARCHIVES (LOGS & DATA TABLES)
# =========================================================
with tab_archives:
    st.markdown('<div class="hud-card"><div class="hud-title">📜 Tactical Match Archive Logs <span>Chronological Competitive Records</span></div>', unsafe_allow_html=True)
    
    if not norm.empty:
        for date_val, group in norm.groupby(norm["Date"].dt.date, sort=False):
            with st.expander(f"MATCH SESSION: {date_val} ({len(group)} Operatives Tracked)", expanded=False):
                display_cols = [c for c in ["Player", "Role", "Agent", "Overall", "KD", "ACS", "HS%"] if c in group.columns]
                st.dataframe(
                    group[display_cols].style.format({
                        "Overall": "{:.2f}",
                        "KD": "{:.2f}",
                        "ACS": "{:.1f}",
                        "HS%": "{:.1f}%"
                    }),
                    width="stretch"
                )
    else:
        st.info("No match sessions recorded.")
    st.markdown('</div>', unsafe_allow_html=True)
