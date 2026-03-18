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


st.set_page_config(page_title="Game Drifters Valorant Team", layout="wide")
pd.options.mode.chained_assignment = None

# =========================================================
# BACKGROUND
# =========================================================
def set_background(video="background.mp4"):
    path = Path(video)
    if path.exists():
        encoded = base64.b64encode(path.read_bytes()).decode()
        st.markdown(f"""
        <style>
        .block-container {{padding:0rem 1.5rem 0rem 1.5rem!important;max-width:100%!important;}}
        header, footer {{visibility:hidden;}}
        .stApp {{background:transparent;}}
        #bgvid {{position:fixed;top:0;left:0;width:100vw;height:100vh;object-fit:cover;z-index:-1000;filter:brightness(.25);}}
        .overlay {{position:fixed;inset:0;background:radial-gradient(circle,rgba(255,70,85,.15),rgba(0,0,0,.95));z-index:-999;}}
        </style>
        <video autoplay muted loop playsinline id="bgvid">
            <source src="data:video/mp4;base64,{encoded}" type="video/mp4">
        </video>
        <div class="overlay"></div>
        """, unsafe_allow_html=True)
set_background()

# =========================================================
# STYLE
# =========================================================
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Teko:wght@600;700&display=swap');

.card{
    background:rgba(20,20,25,.65);
    border:1px solid rgba(255,70,85,.4);
    border-radius:8px;
    padding:18px;
    margin-bottom:18px;
    backdrop-filter:blur(6px);
}

.section-title{
    font-size:18px;
    color:#ff4655;
    margin-bottom:14px;
    font-weight:700;
}

.rankrow{
    display:flex;
    align-items:center;
    gap:14px;
    padding:10px;
    margin-bottom:8px;
    background:rgba(255,255,255,.03);
    border-radius:6px
}

.rankrow img{
    height:46px;
    border-radius:4px
}

/* ===== VALORANT HEADER ===== */

.valorant-title {
    font-family: 'Teko', sans-serif;
    font-size: 80px;
    font-weight: 700;
    letter-spacing: 8px;
    text-align: center;
    text-transform: uppercase;
    margin-top: 30px;

    background: linear-gradient(180deg, #ffffff 0%, #ffb3b8 40%, #ff4655 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;

    text-shadow:
        0 0 8px rgba(255,70,85,0.5),
        0 0 20px rgba(255,70,85,0.25);
}

.valorant-sub {
    font-family: 'Teko', sans-serif;
    font-size: 44px;
    letter-spacing: 6px;
    text-align: center;
    text-transform: uppercase;
    color: #ff4655;
    margin-top: -25px;
}

.valorant-line {
    width: 160px;
    height: 3px;
    margin: 20px auto;
    background: linear-gradient(to right, transparent, #ff4655, transparent);
}

.valorant-tag {
    text-align: center;
    color: #9ca3af;
    font-size: 15px;
    letter-spacing: 1px;
    margin-bottom: 40px;
}
/* ===== CARD ANIMATION ===== */

.card-anim {
    transition: all 0.25s ease;
}

.card-anim:hover {
    transform: scale(1.03);
    box-shadow: 0 0 25px rgba(255,70,85,0.4);
}

/* ===== MVP GLOW ===== */

.mvp {
    border: 2px solid gold !important;
    box-shadow: 0 0 20px gold;
}
/* ===== ROLE BADGES ===== */

.badge {
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 11px;
    margin-left: 6px;
}

.badge-duelist { background:#ff4655; color:white; }
.badge-controller { background:#3b82f6; color:white; }
.badge-initiator { background:#10b981; color:white; }
.badge-sentinel { background:#f59e0b; color:black; }
.badge-igl { background:#8b5cf6; color:white; }

.stat-row{
    display:flex;
    gap:12px;
    margin-top:10px;
}

.stat-box{
    background:rgba(255,255,255,0.05);
    padding:6px 10px;
    border-radius:6px;
    display:flex;
    flex-direction:column;
    min-width:70px;
}

.stat-label{
    font-size:10px;
    color:#9ca3af;
    text-transform:uppercase;
}

.stat-value{
    font-size:14px;
    color:white;
    font-weight:600;
}

.mvp-tag{
    margin-top:8px;
    color:gold;
    font-weight:bold;
    font-size:13px;
}

</style>
""", unsafe_allow_html=True)

st.markdown('<div class="valorant-title">Game Drifters</div>', unsafe_allow_html=True)
st.markdown('<div class="valorant-sub">Valorant Roster</div>', unsafe_allow_html=True)
st.markdown('<div class="valorant-line"></div>', unsafe_allow_html=True)
st.markdown('<div class="valorant-tag">Members Performance Analytics</div>', unsafe_allow_html=True)

# =========================================================
# Tracker Data
# =========================================================

def fetch_tracker_stats(riot_id):

    try:
        name, tag = riot_id.split("#")
        name = name.strip().lower()
        tag = tag.strip().lower()

        headers = {"Authorization": API_KEY}

        # ---------- GET ACCOUNT ----------
        acc_url = f"https://api.henrikdev.xyz/valorant/v1/account/{name}/{tag}"
        acc = requests.get(acc_url, headers=headers)

        if acc.status_code != 200:
            return None

        account = acc.json()["data"]

        region_raw = str(account.get("region", "")).lower()

        REGION_MAP = {
            "ap": "ap",
            "eu": "eu",
            "na": "na",
            "kr": "kr",
            "latam": "latam",
            "br": "br"
        }

        region = REGION_MAP.get(region_raw, "ap")
        player_puuid = account["puuid"]

        # ---------- GET MATCHES (NO ACT FILTER) ----------
        url = f"https://api.henrikdev.xyz/valorant/v3/by-puuid/matches/{region}/{player_puuid}?mode=competitive&size=20"
        r = requests.get(url, headers=headers)

        if r.status_code != 200:
            return None

        matches = r.json().get("data", [])

        # ---------- ACCUMULATORS ----------
        total_kills = 0
        total_deaths = 0
        total_assists = 0
        total_headshots = 0
        total_shots = 0
        total_score = 0
        total_rounds = 0
        competitive_games = 0

        for match in matches:

            metadata = match.get("metadata", {})

            queue = str(metadata.get("queue", "")).lower()
            mode  = str(metadata.get("mode", "")).lower()

            # skip non-competitive garbage
            if any(x in (queue + mode) for x in [
                "deathmatch", "swift", "spike",
                "escalation", "replication",
                "snowball", "custom"
            ]):
                continue

            rounds = max(1, metadata.get("rounds_played", 1))

            for p in match.get("players", {}).get("all_players", []):

                if p.get("puuid") != player_puuid:
                    continue

                stats = p.get("stats", {})

                kills   = stats.get("kills", 0)
                deaths  = stats.get("deaths", 0)
                assists = stats.get("assists", 0)
                damage  = stats.get("damage_made", 0)

                headshots = stats.get("headshots", 0)
                body      = stats.get("bodyshots", 0)
                legs      = stats.get("legshots", 0)

                total_kills += kills
                total_deaths += deaths
                total_assists += assists

                total_headshots += headshots
                total_shots += headshots + body + legs

                # same ACS logic you used
                total_score += damage + (kills * 150) + (assists * 50)
                total_rounds += rounds

                competitive_games += 1
                break

            if competitive_games >= 20:
                break

        if competitive_games == 0:
            return None

        # ---------- FINAL ----------
        KD  = total_kills / max(1, total_deaths)
        ACS = total_score / max(1, total_rounds)
        HS  = (total_headshots / max(1, total_shots)) * 100

        return {
            "KD": round(KD, 2),
            "ACS": round(ACS, 1),
            "HS%": round(HS, 1)
        }

    except Exception as e:
        st.error(e)
        return None

# =========================================================
# DATA
# =========================================================
SHEET_URL="https://docs.google.com/spreadsheets/d/1p5u4T--HBuZhsoFBUoZmLnYH7Qvk8m7Ts7flv7xVCW0/export?format=csv&gid=0"

def clean_riot_id(player):

    if pd.isna(player):
        return None

    player = str(player)

    # remove weird unicode spaces
    player = player.replace("\xa0", " ")

    # normalize spacing
    player = " ".join(player.split())

    # remove space before #
    player = player.replace(" #", "#")

    return player.strip()

@st.cache_data(ttl=30)
def load():
    # ---- LIVE DATA (Sheet1)
    df = pd.read_csv(SHEET_URL)
    df.columns = df.columns.str.strip()

    df = df[df["Player"].notna()]
    df = df[df["Player"].astype(str).str.contains("#")]
    df["Player"] = df["Player"].apply(clean_riot_id)

    df["Date"] = pd.to_datetime(
        df["Date"],
        errors="coerce",
        dayfirst=True
    )

    # ---- HISTORY DATA (Data sheet)
    history_url = "https://docs.google.com/spreadsheets/d/1p5u4T--HBuZhsoFBUoZmLnYH7Qvk8m7Ts7flv7xVCW0/gviz/tq?tqx=out:csv&sheet=Data"

    history = pd.read_csv(history_url)
    history.columns = history.columns.str.strip()
    history["Player"] = history["Player"].apply(clean_riot_id)
    history["Date"] = pd.to_datetime(history["Date"], errors="coerce", dayfirst=True)
    
    for col in ["HS%","ACS","KD"]:
        history[col] = pd.to_numeric(history[col], errors="coerce")

    return df.sort_values("Date"), history.sort_values("Date")

df, history = load()

# =========================================================
# UPDATE TRACKER BUTTON (SAFE BULK UPDATE)
# =========================================================

if st.button("Update Stats"):

    scope = [
        "https://spreadsheets.google.com/feeds",
        "https://www.googleapis.com/auth/drive"
    ]

    creds = ServiceAccountCredentials.from_json_keyfile_dict(
        st.secrets["gcp_service_account"],
        scope
    )

    client = gspread.authorize(creds)

    spreadsheet = client.open_by_key(
        "1p5u4T--HBuZhsoFBUoZmLnYH7Qvk8m7Ts7flv7xVCW0")

    sheet = spreadsheet.sheet1
    data_sheet = spreadsheet.worksheet("Data")

    rows = sheet.get_all_values()

    header = rows[0]
    player_col = header.index("Player")

    batch_updates = []
    updated = 0
    processed = 0

    today = pd.Timestamp.today().strftime("%d-%m-%Y")
    history_rows = data_sheet.get_all_values()

    history_lookup = {(r[0], r[1]): i for i, r in enumerate(history_rows[1:], start=2) if len(r) >= 2}
    
    for sheet_row, row in enumerate(rows[1:], start=2):

        if len(row) <= player_col:
            continue

        riot_id = row[player_col].strip()

        if "#" not in riot_id:
            continue

        st.write("Checking:", riot_id)

        # REAL API CALL
        stats = fetch_tracker_stats(riot_id)
        processed += 1
        
        if not stats:
            st.warning(f"No recent match data → {riot_id}")
        else:
            batch_updates.append({
                "range": f"J{sheet_row}:L{sheet_row}",
                "values": [[
                    stats["HS%"],
                    stats["ACS"],
                    stats["KD"]
                ]]
            })
        
            role = row[header.index("Role")]
            agent = row[header.index("Agent")]
            
            player_row_found = history_lookup.get((today, riot_id))

            aim = row[header.index("Aim")]
            utility = row[header.index("Utility")]
            comms = row[header.index("Comms")]
            entry = row[header.index("Entry")]
            clutch = row[header.index("Clutch")]
            
            history_data = [
                today,
                riot_id,
                role,
                agent,
                aim,
                utility,
                comms,
                entry,
                clutch,
                stats["HS%"],
                stats["ACS"],
                stats["KD"]
            ]
        
            if player_row_found:
                # overwrite today's entry
                data_sheet.update(f"A{player_row_found}:L{player_row_found}", [history_data])
            else:
                # append new day entry
                data_sheet.append_row(history_data)
        
            updated += 1

        # ✅ RATE LIMIT PROTECTION (ONLY AFTER CALLS)
        if processed % 5 == 0:
            with st.spinner("Cooling API requests..."):
                time.sleep(50)
        

    # ✅ ONE GOOGLE API UPDATE
    if batch_updates:
        sheet.batch_update(batch_updates)

    st.success(f"{updated} players updated correctly ✅")

# safe numeric conversion
for col in df.columns:
    if col not in ["Date","Player","Role","Agent"]:
        df[col]=pd.to_numeric(df[col],errors="coerce")

# Role benchmark values
ROLE_STATS = {
    "Duelist": {"HS%":26, "ACS":265, "KD":1.32},
    "Controller": {"HS%":22, "ACS":220, "KD":1.18},
    "Initiator": {"HS%":23, "ACS":235, "KD":1.22},
    "Sentinel": {"HS%":22, "ACS":230, "KD":1.20},
    "IGL": {"HS%":20, "ACS":205, "KD":1.10}
}
ROLE_TARGETS = {
    "Duelist": {"Aim":9, "Utility":6.5, "Comms":7, "Entry":10, "Clutch":7.5},
    "Controller": {"Aim":7.5, "Utility":9, "Comms":8.5, "Entry":6, "Clutch":8.5},
    "Initiator": {"Aim":8, "Utility":9.5, "Comms":8.5, "Entry":8.5, "Clutch":8},
    "Sentinel": {"Aim":7.5, "Utility":8.5, "Comms":8, "Entry":5.5, "Clutch":9},
    "IGL": {"Aim":7, "Utility":8, "Comms":10, "Entry":6.5, "Clutch":9.5}
}

def rate(stat,val,role):
    if pd.isna(val): 
        return np.nan
        
    if stat in ["Aim","Utility","Comms","Entry","Clutch"]:
        target = ROLE_TARGETS.get(role, {}).get(stat, None)
        if target:
            score = (val / target) * 10
            return np.clip(score, 0, 10)
        return np.nan
        
    if stat in ["HS%","ACS","KD"]:
        role_avg = ROLE_STATS.get(role, {}).get(stat, None)
        if role_avg:
            score = (val / role_avg) * 10
            return np.clip(score, 0, 10)
            
    return np.nan

metrics=["Aim","Utility","Comms","Entry","Clutch","HS%","ACS","KD"]

norm=df.copy()

for m in metrics:
    if m in norm.columns:
        norm[m]=norm.apply(lambda r: rate(m, r[m], r["Role"]), axis=1)

# ===== SPLIT METRICS =====
coach_metrics = ["Aim","Utility","Comms","Entry","Clutch"]
stat_metrics = ["HS%","ACS","KD"]

norm["CoachScore"] = norm[coach_metrics].mean(axis=1, skipna=True)
norm["StatScore"] = norm[stat_metrics].mean(axis=1, skipna=True)

# ===== ROLE WEIGHTS =====
ROLE_WEIGHTS = {
    "Duelist": 0.40,
    "Initiator": 0.35,
    "Controller": 0.30,
    "Sentinel": 0.30,
    "IGL": 0.25
}

# ===== FINAL SCORE =====
def final_score(row):
    role = row["Role"]
    stat_weight = ROLE_WEIGHTS.get(role,0.30)
    coach_weight = 1 - stat_weight

    coach = row["CoachScore"] if pd.notna(row["CoachScore"]) else 0
    stat  = row["StatScore"] if pd.notna(row["StatScore"]) else 0

    return (coach * coach_weight) + (stat * stat_weight)

# =========================================================
# AGENT IMAGES
# =========================================================
AGENT_IMAGES = {
# Duelists
"jett":"https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png",
"raze":"https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5aa313dba261/displayicon.png",
"reyna":"https://media.valorant-api.com/agents/a3bfb853-43b2-7238-a4f1-ad90e9e46bcc/displayicon.png",
"phoenix":"https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7921d69/displayicon.png",
"yoru":"https://media.valorant-api.com/agents/7f94d92c-4234-0a36-9646-3a87eb8b5c89/displayicon.png",
"neon":"https://media.valorant-api.com/agents/bb2a4828-46eb-8cd1-e765-15848195d751/displayicon.png",
"iso":"https://media.valorant-api.com/agents/0e38b510-41a8-5780-9b3a-90a9f4f8b1ff/displayicon.png",
"waylay":"https://media.valorant-api.com/agents/df1cb487-4902-002e-5c17-d28e83e78588/displayicon.png",

# Controllers
"omen":"https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png",
"brimstone":"https://media.valorant-api.com/agents/9f0d8ba9-4140-b941-57d3-a7ad57c6b417/displayicon.png",
"viper":"https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494859/displayicon.png",
"astra":"https://media.valorant-api.com/agents/41fb69c1-4189-7b37-f117-bcaf1e96f1bf/displayicon.png",
"harbor":"https://media.valorant-api.com/agents/95b78ed7-4637-86d9-7e41-71ba8c293152/displayicon.png",
"clove":"https://media.valorant-api.com/agents/1dbf2edd-4729-0984-3115-daa5eed44993/displayicon.png",

# Initiators
"sova":"https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png",
"breach":"https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-13acf203c006/displayicon.png",
"skye":"https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/displayicon.png",
"kay/o":"https://media.valorant-api.com/agents/601dbbe7-43ce-be57-2a40-4abd24953621/displayicon.png",
"fade":"https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/displayicon.png",
"gekko":"https://media.valorant-api.com/agents/e370fa57-4757-3604-3648-499e1f642d3f/displayicon.png",

# Sentinels
"sage":"https://media.valorant-api.com/agents/569fdd95-4d10-43ab-ca70-79becc718b46/displayicon.png",
"cypher":"https://media.valorant-api.com/agents/117ed9e3-49f3-6512-3ccf-0cada7e3823b/displayicon.png",
"killjoy":"https://media.valorant-api.com/agents/1dbf2edd-4729-0984-3115-daa5eed44993/displayicon.png",
"chamber":"https://media.valorant-api.com/agents/22697a3d-45bf-8dd7-4fec-84a9e28c69d7/displayicon.png",
"vyse":"https://media.valorant-api.com/agents/efba5359-4016-a1e5-7626-b1ae76895940/displayicon.png",
"deadlock":"https://media.valorant-api.com/agents/cc8b64c8-4b25-4ff9-6e7f-37b4da43d235/displayicon.png"
}
def agent_img(agent):
    if pd.isna(agent): return ""
    return AGENT_IMAGES.get(str(agent).lower().strip(),"")


# =========================================================
# PLAYER CARD AND TEAM RANK
# =========================================================

def highlight_card(player, df, rank):

    pdata = df[df["Player"] == player]
    if pdata.empty:
        return ""

    overall = pdata["Overall"].mean()
    form = pdata.tail(3)["Overall"].mean()

    hs = pdata["HS%"].mean()
    kd = pdata["KD"].mean()

    role = pdata["Role"].iloc[-1] if "Role" in pdata.columns else ""
    role_class = f"badge-{role.lower()}" if role else "badge"

    tier = "S" if overall >= 9 else "A" if overall >= 8 else "B" if overall >= 7 else "C"
    mvp_class = "mvp" if rank == 1 else ""

    agent = pdata["Agent"].iloc[-1] if "Agent" in pdata.columns else None
    img = agent_img(agent)

    img_tag = f'<img src="{img}" style="height:70px;width:70px;border-radius:8px;object-fit:cover;">' if img else ""

    return f"""<div class="card-anim {mvp_class}" style="display:flex;align-items:center;gap:14px;background:linear-gradient(135deg, rgba(255,70,85,.25), rgba(0,0,0,.9));border:1px solid rgba(255,70,85,.5);border-radius:12px;padding:18px;margin-bottom:15px;">
    {img_tag}
    <div style="flex:1;">
    
    <div style="display:flex;justify-content:space-between;align-items:center;">
    <div style="display:flex;align-items:center;gap:8px;">
    <b style="color:white;font-size:18px;">{player}</b>
    <span class="badge {role_class}">{role}</span>
    </div>
    <span style="color:#ff4655;font-weight:bold;">#{rank} {tier}</span>
    </div>
    
    <div class="stat-row">
    <div class="stat-box">
    <span class="stat-label">Overall</span>
    <span class="stat-value">{overall:.2f}</span>
    </div>
    
    <div class="stat-box">
    <span class="stat-label">Form</span>
    <span class="stat-value">{form:.2f}</span>
    </div>
    </div>
    
    <div class="stat-row">
    <div class="stat-box">
    <span class="stat-label">HS%</span>
    <span class="stat-value">{hs:.1f}%</span>
    </div>
    
    <div class="stat-box">
    <span class="stat-label">K/D</span>
    <span class="stat-value">{kd:.2f}</span>
    </div>
    </div>
    
    {"<div class='mvp-tag'>MVP</div>" if rank==1 else ""}
    
    </div>
    </div>"""
norm["Overall"] = norm.apply(final_score,axis=1)
# =========================
# TOP PERFORMERS (GLOBAL)
# =========================

st.markdown('<div class="card"><div class="section-title">Top Performers</div>',unsafe_allow_html=True)
top_players = norm.groupby("Player")["Overall"].mean().sort_values(ascending=False).head(5).index
html_block = ""
for i, p in enumerate(top_players, start=1):
    html_block += highlight_card(p, norm, i)

components.html(f"""
<style>
body {{
    margin:0;
    padding:12px;
    font-family:'Teko',sans-serif;
    background:transparent;
}}

/* ===== GRID (FIXED 3 PER ROW) ===== */
.grid {{
    display:grid;
    grid-template-columns: repeat(3, 1fr);
    gap:20px;
}}

/* ===== CARD ===== */
.card {{
    display:flex;
    gap:14px;
    padding:16px;
    border-radius:12px;
    background:linear-gradient(135deg, rgba(255,70,85,.35), rgba(0,0,0,.95));
    border:1px solid rgba(255,70,85,.6);
    transition:0.25s;
    min-height:110px;
}}

.card:hover {{
    transform:scale(1.04);
    box-shadow:0 0 25px rgba(255,70,85,.5);
}}

/* ===== MVP BIG ===== */
.mvp {{
    grid-column: span 2;
    border:2px solid gold;
    box-shadow:0 0 25px gold;
}}

/* ===== IMAGE ===== */
.card img {{
    width:70px;
    height:70px;
    border-radius:8px;
}}

/* ===== TEXT ===== */
.name {{
    font-size:18px;
    color:white;
}}

.rank {{
    color:#ff4655;
    font-size:13px;
    font-weight:bold;
}}

/* ===== BADGES ===== */
.badge {{
    padding:3px 8px;
    border-radius:6px;
    font-size:10px;
}}

.badge-duelist {{background:#ff4655;color:white;}}
.badge-controller {{background:#3b82f6;color:white;}}
.badge-initiator {{background:#10b981;color:white;}}
.badge-sentinel {{background:#f59e0b;color:black;}}

/* ===== STATS ===== */
.stats {{
    margin-top:6px;
    font-size:13px;
    color:#e5e7eb;
}}

.mvp-tag {{
    color:gold;
    margin-top:6px;
    font-size:13px;
}}
</style>

<div class="grid">
{html_block
    .replace('card-anim', 'card')
    .replace('stat-row', 'stats')
    .replace('stat-box','')
    .replace('stat-label','')
    .replace('stat-value','')
}
</div>
""", height=450)

st.markdown("</div>",unsafe_allow_html=True)
role_best = (
    norm.groupby(["Role","Player"])["Overall"]
    .mean()
    .reset_index()
)

role_best = role_best.loc[
    role_best.groupby("Role")["Overall"].idxmax()
]

st.markdown('<div class="card"><div class="section-title">Best Player Per Role</div>', unsafe_allow_html=True)

role_order = ["Duelist","Initiator","Controller","Sentinel","IGL"]
role_best = role_best.set_index("Role").reindex(role_order).dropna().reset_index()
cols = st.columns(len(role_best))

for i, (_, row) in enumerate(role_best.iterrows()):
    with cols[i]:
        st.markdown(f"""
        <div style="
        background:rgba(20,20,25,.7);
        border:1px solid rgba(255,70,85,.3);
        border-radius:10px;
        padding:12px;
        text-align:center;
        ">

        <div style="color:#9ca3af;font-size:12px;">{row['Role']}</div>
        <div style="color:white;font-size:16px;font-weight:bold;">{row['Player']}</div>
        <div style="color:#ff4655;font-size:14px;">{row['Overall']:.2f}</div>

        </div>
        """, unsafe_allow_html=True)

st.markdown("</div>", unsafe_allow_html=True)

# =========================================================
# PLAYER
# =========================================================
player=st.selectbox("Player",norm["Player"].dropna().unique())
player_df = norm[norm["Player"] == player]

avg_performance = player_df["Overall"].mean()
kd = player_df["KD"].mean()
hs = player_df["HS%"].mean()
pn=norm[(norm["Player"]==player)&(norm["Overall"].notna())]

career=pn["Overall"].mean()
form=pn.tail(3)["Overall"].mean()
consistency=max(0,10-(pn["Overall"].std()*4)) if len(pn)>1 else 10
impact=career*0.6+form*0.25+consistency*0.15

# =========================================================
# GAUGE
# =========================================================

def gauge(title,value):
    fig=go.Figure(go.Indicator(
        mode="gauge+number",
        value=float(value),
        number={'suffix':" /10",'font':{'size':40}},
        title={'text':title,'font':{'size': 20,'color':'#ff4655'}},
        gauge={'axis':{'range':[0,10]},'bar':{'color':'#ff4655'}}
    ))
    fig.update_layout(paper_bgcolor="rgba(0,0,0,0)",height=300)
    return fig



st.markdown('<div class="card"><div class="section-title">Player Analytics</div>',unsafe_allow_html=True)
c1,c2,c3,c4=st.columns(4)
c1.plotly_chart(gauge("Performance",career),width="stretch")
c2.plotly_chart(gauge("Consistency",consistency),width="stretch")
c3.plotly_chart(gauge("Form",form),width="stretch")
c4.plotly_chart(gauge("Impact",impact),width="stretch")
st.markdown("</div>",unsafe_allow_html=True)

# =========================================================
# PRO ANALYTICS DASHBOARD
# =========================================================

st.markdown('<div class="card"><div class="section-title">Advanced Analytics</div>',unsafe_allow_html=True)

# ==========================
# PERFORMANCE TREND
# ==========================
trend = history[history["Player"] == player].copy()
coach_cols = ["Aim","Utility","Comms","Entry","Clutch"]

for c in coach_cols:
    if c in trend.columns:
        trend[c] = pd.to_numeric(trend[c], errors="coerce")
        
# calculate normalized scores same as main system
trend["HS_score"] = trend.apply(lambda r: rate("HS%", r["HS%"], r["Role"]), axis=1)
trend["ACS_score"] = trend.apply(lambda r: rate("ACS", r["ACS"], r["Role"]), axis=1)
trend["KD_score"] = trend.apply(lambda r: rate("KD", r["KD"], r["Role"]), axis=1)

coach_cols = ["Aim","Utility","Comms","Entry","Clutch"]

for m in coach_metrics:
    trend[m] = trend.apply(lambda r: rate(m, r[m], r["Role"]), axis=1)

trend["CoachScore"] = trend[coach_metrics].mean(axis=1)
trend["StatScore"] = trend[["HS_score","ACS_score","KD_score"]].mean(axis=1)

trend["Overall"] = trend.apply(final_score, axis=1)

trend = trend.sort_values("Date").tail(10)

if not trend.empty:
    fig_trend = px.line(
        trend,
        x="Date",
        y="Overall",
        markers=True,
        line_shape="spline",
        title="Performance Trend"
    )

    fig_trend.update_layout(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font_color="white",
        yaxis=dict(range=[0,10])
    )


# ==========================
# COACH METRICS CHART
# ==========================
coach_values = pn[coach_metrics].mean()

fig_coach = px.bar(
    x=coach_values.index,
    y=coach_values.values,
    labels={"x":"Metric","y":"Score"},
    title="Coach Metrics"
)

fig_coach.update_layout(
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
    font_color="white",
    yaxis=dict(range=[0,10])
)


# ==========================
# MECHANICAL STATS
# ==========================
stat_values = pn[stat_metrics].mean()

fig_mech = px.bar(
    x=stat_values.index,
    y=stat_values.values,
    labels={"x":"Stat","y":"Score"},
    title="Mechanical Stats"
)

fig_mech.update_layout(
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
    font_color="white",
    yaxis=dict(range=[0,10])
)


# ==========================
# PLAYER RADAR CHART
# ==========================
radar_metrics = coach_metrics + stat_metrics

radar_values = pn[radar_metrics].mean()

fig_radar = go.Figure()

fig_radar.add_trace(go.Scatterpolar(
    r=radar_values.values,
    theta=radar_metrics,
    fill="toself",
    line_color="#ff4655"
))

fig_radar.update_layout(
    polar=dict(radialaxis=dict(visible=True,range=[0,10])),
    showlegend=False,
    paper_bgcolor="rgba(0,0,0,0)",
    font_color="white",
    title="Player Radar"
)

# ==========================
# ROLE COMPARISON
# ==========================
role_avg = norm.groupby("Role")["Overall"].mean().reset_index()

fig_role = px.bar(
    role_avg,
    x="Role",
    y="Overall",
    title="Role Performance (Average performance of all players in the role)",
    color="Overall",
    color_continuous_scale="Reds"
)

fig_role.update_layout(
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
    font_color="white",
    yaxis=dict(range=[0,10])
)

# ===== DASHBOARD LAYOUT =====

col1, col2 = st.columns(2)

with col1:
    if not trend.empty:
        st.plotly_chart(fig_trend,width="stretch")
    st.plotly_chart(fig_mech,width="stretch")

with col2:
    st.plotly_chart(fig_coach,width="stretch")
    st.plotly_chart(fig_radar,width="stretch")

st.plotly_chart(fig_role,width="stretch")

st.markdown("</div>",unsafe_allow_html=True)

# =========================================================
# PERFORMANCE BREAKDOWN
# =========================================================
st.markdown('<div class="card"><div class="section-title">Performance Breakdown</div>',unsafe_allow_html=True)

plot = history[history["Player"] == player].sort_values("Date").tail(10)
if plot.empty:
    st.info("No historical data yet. Press 'Update Stats' first.")
    st.stop()

# ===============================
# NORMALIZE STATS TO 0-10 SCALE
# ===============================
plot = plot.copy()

if "ACS" in plot.columns:
    plot["ACS_norm"] = plot.apply(lambda r: rate("ACS", r["ACS"], r["Role"]), axis=1)

if "HS%" in plot.columns:
    plot["HS_norm"] = plot.apply(lambda r: rate("HS%", r["HS%"], r["Role"]), axis=1)

if "KD" in plot.columns:
    plot["KD_norm"] = plot.apply(lambda r: rate("KD", r["KD"], r["Role"]), axis=1)


metrics_for_graph = [
    "Aim","Utility","Comms","Entry","Clutch",
    "HS_norm","ACS_norm","KD_norm"
]

existing = [m for m in metrics_for_graph if m in plot.columns]

long = plot.melt(
    id_vars="Date",
    value_vars=existing,
    var_name="Metric",
    value_name="Score"
).dropna()

# clean names
long["Metric"] = long["Metric"].replace({
    "HS_norm":"HS%",
    "ACS_norm":"ACS",
    "KD_norm":"KD"
})

fig = px.line(
    long,
    x="Date",
    y="Score",
    color="Metric",
    markers=True,
    line_shape="spline"
)

fig.update_layout(
    paper_bgcolor="rgba(0,0,0,0)",
    plot_bgcolor="rgba(0,0,0,0)",
    font_color="white",
    yaxis=dict(range=[0,10], title="Performance Score"),
    legend_title="Metric"
)

st.plotly_chart(fig,width="stretch")
st.markdown("</div>",unsafe_allow_html=True)

# =========================================================
# MATCH LOGS
# =========================================================
st.markdown('<div class="card"><div class="section-title">Match Logs</div>',unsafe_allow_html=True)
for d,g in pn.groupby(pn["Date"].dt.date):
    with st.expander(str(d)):
        st.dataframe(g[["Role","Overall"]+metrics],width="stretch")
st.markdown("</div>",unsafe_allow_html=True)

st.markdown('<div class="card"><div class="section-title">Team Rankings</div>',unsafe_allow_html=True)

rank = norm.groupby("Player").agg({
        "Overall":"mean",
        "KD":"mean",
        "ACS":"mean"
    }).sort_values(
        by=["Overall","KD","ACS"],
        ascending=False
    )

for i,(p,row) in enumerate(rank.iterrows(),1):
    s = row["Overall"]
    tier="S" if s>=9 else "A" if s>=8 else "B" if s>=7 else "C"
    agent=df[df["Player"]==p]["Agent"].dropna()
    agent=agent.iloc[-1] if len(agent) else None
    img=agent_img(agent)

    st.markdown(f"""
    <div class="rankrow">
        <img src="{img}">
        <div>
        <b style='color:white'>{i}. {p}</b><br>
        <span style='color:#ff4655'>{s:.2f}/10 ({tier})</span>
        </div>
    </div>
    """,unsafe_allow_html=True)

st.markdown("</div>",unsafe_allow_html=True)

