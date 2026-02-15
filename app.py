import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px

# ---------------- PAGE ----------------
st.set_page_config(page_title="Team iNTellectual", layout="wide")

st.markdown("""
<style>
.block-container {padding-top:1.5rem;background:linear-gradient(180deg,#0b0f1a,#05070d);}
h1,h2,h3 {color:white;}
[data-testid="stMetricValue"] {color:#ff4655;font-size:38px;font-weight:700;}
[data-testid="stMetricLabel"] {color:#9aa0a6;letter-spacing:1px;}
</style>
""", unsafe_allow_html=True)

st.title("🎮 Team iNTellectual Analytics")

# ---------------- PANEL HELPER ----------------
def panel(title):
    st.markdown(f"""
    <div style="
        background: rgba(20,25,40,0.65);
        padding:18px;
        border-radius:14px;
        border:1px solid rgba(255,70,85,0.25);
        margin-bottom:12px">
        <h3 style='margin-top:0;color:white'>{title}</h3>
    </div>
    """, unsafe_allow_html=True)

# ---------------- DATA ----------------
SHEET_URL = "https://docs.google.com/spreadsheets/d/1p5u4T--HBuZhsoFBUoZmLnYH7Qvk8m7Ts7flv7xVCW0/export?format=csv&gid=0"

@st.cache_data(ttl=20)
def load_data():
    df = pd.read_csv(SHEET_URL)
    df.columns = df.columns.str.strip()
    return df

df = load_data()
if df.empty:
    st.error("Sheet empty")
    st.stop()

# ---------------- CLEAN ----------------
df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
df = df.sort_values("Date")

numeric_cols = df.columns.difference(["Date","Player","Role"])
for col in numeric_cols:
    df[col] = pd.to_numeric(df[col], errors="coerce")

skill_cols = [c for c in numeric_cols if c not in ["Exam scores","Overall Performance"]]

# ---------------- NORMALIZE ----------------
norm = df.copy()
for col in skill_cols:
    max_val = norm[col].max(skipna=True)
    if pd.notna(max_val) and max_val!=0:
        norm[col] = (norm[col]/max_val)*100

# ---------------- ROLE SCORING ----------------
ROLE_WEIGHTS={
"Duelist":{"Aim":25,"Entry":25,"ACS":20,"Clutch":15,"HS%":10,"Utility":5},
"Controller":{"Utility":25,"Comms":20,"Clutch":15,"ACS":15,"Aim":10,"Entry":5,"HS%":10},
"Initiator":{"Utility":25,"Comms":15,"ACS":20,"Entry":15,"Aim":10,"Clutch":10,"HS%":5},
"Sentinel":{"Clutch":25,"Utility":20,"Comms":15,"ACS":15,"Aim":10,"HS%":10,"Entry":5},
"IGL":{"Comms":35,"Utility":20,"Clutch":15,"ACS":10}
}

def role_score(row):
    role=str(row.get("Role","")).strip()
    weights=ROLE_WEIGHTS.get(role,{})
    total=0
    wsum=0
    for s,w in weights.items():
        if s in row and pd.notna(row[s]):
            total+=row[s]*w
            wsum+=w
    return total/wsum if wsum else np.nan

norm["Overall"]=norm.apply(role_score,axis=1)

def scalar(x):
    if isinstance(x,(pd.Series,pd.DataFrame)):
        return float(np.nanmean(x.values))
    return 0.0 if pd.isna(x) else float(x)

# ---------------- PLAYER ----------------
player=st.selectbox("Select Player",df["Player"].dropna().unique())
pn=norm[norm["Player"]==player]
latest=pn.iloc[-1]

team_avg=scalar(norm.groupby("Player")["Overall"].mean())
player_score=scalar(latest["Overall"])

# ===================== TOP PANELS =====================
top_left,top_right=st.columns([2,1])

with top_left:
    panel("Player Report Card")

    skills=[s for s in skill_cols if pd.notna(latest[s])]
    best=max(skills,key=lambda x:latest[x]) if skills else "N/A"
    worst=min(skills,key=lambda x:latest[x]) if skills else "N/A"

    consistency=100-scalar(pn["Overall"].tail(5).std()) if len(pn)>1 else 100
    consistency=max(min(consistency,100),0)
    trend=scalar(pn["Overall"].diff().mean())

    c1,c2,c3,c4=st.columns(4)
    c1.metric("Overall",f"{player_score:.1f}")
    c2.metric("Consistency",f"{consistency:.1f}%")
    c3.metric("Trend",f"{trend:+.2f}")
    c4.metric("Vs Team",f"{player_score-team_avg:+.1f}")

    st.write(f"🔥 Strongest: {best}")
    st.write(f"🧠 Practice: {worst}")

with top_right:
    panel("Team Impact Share")
    impact=norm.groupby("Player")["Overall"].mean()
    impact_pct=(impact/impact.sum())*100
    idf=impact_pct.reset_index()
    idf.columns=["Player","Impact"]

    fig=px.pie(idf,names="Player",values="Impact",hole=0.6)
    fig.update_traces(textinfo="percent")
    fig.update_layout(paper_bgcolor="#05070d",font_color="white",showlegend=False)
    st.plotly_chart(fig,use_container_width=True)

# ===================== MID PANELS =====================
mid_left,mid_right=st.columns(2)

with mid_left:
    panel("Skill Radar")
    radar=pd.DataFrame({"Skill":skill_cols,"Value":[scalar(latest[s]) for s in skill_cols]})
    fig2=px.line_polar(radar,r="Value",theta="Skill",line_close=True)
    fig2.update_traces(fill="toself")
    fig2.update_layout(paper_bgcolor="#05070d",font_color="white")
    st.plotly_chart(fig2,use_container_width=True)

with mid_right:
    panel("Performance Trend")
    fig3=px.line(pn,x="Date",y="Overall",markers=True)
    fig3.update_layout(paper_bgcolor="#05070d",font_color="white")
    st.plotly_chart(fig3,use_container_width=True)

# ===================== LEADERBOARD =====================
panel("Team Leaderboard")

rank=norm.groupby("Player")["Overall"].mean().sort_values(ascending=False).reset_index()
rank["Rank"]=range(1,len(rank)+1)

def tier(s):
    if s>=95:return "S"
    if s>=85:return "A"
    if s>=75:return "B"
    return "C"

rank["Tier"]=rank["Overall"].apply(tier)
color_map={"S":"#ff4655","A":"#ff7a85","B":"#ffb3ba","C":"#6c757d"}

fig4=px.bar(rank,x="Overall",y="Player",orientation="h",text="Rank",color="Tier",color_discrete_map=color_map)
fig4.update_traces(textposition="outside")
fig4.update_layout(yaxis=dict(autorange="reversed"),paper_bgcolor="#05070d",plot_bgcolor="#05070d",font_color="white")
st.plotly_chart(fig4,use_container_width=True)

# ===================== DATA =====================
panel("Raw Data")
st.dataframe(df,use_container_width=True)
