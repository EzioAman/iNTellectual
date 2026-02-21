import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import base64
from pathlib import Path

st.set_page_config(page_title="Game Drifters Valorant Team", layout="wide")

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

</style>
""", unsafe_allow_html=True)

st.markdown('<div class="valorant-title">Game Drifters</div>', unsafe_allow_html=True)
st.markdown('<div class="valorant-sub">Valorant Roster</div>', unsafe_allow_html=True)
st.markdown('<div class="valorant-line"></div>', unsafe_allow_html=True)
st.markdown('<div class="valorant-tag">Members Performance Analytics</div>', unsafe_allow_html=True)

# =========================================================
# DATA
# =========================================================
SHEET_URL="https://docs.google.com/spreadsheets/d/1p5u4T--HBuZhsoFBUoZmLnYH7Qvk8m7Ts7flv7xVCW0/export?format=csv&gid=0"

@st.cache_data(ttl=30)
def load():
    df=pd.read_csv(SHEET_URL)
    df.columns=df.columns.str.strip()
    df["Date"]=pd.to_datetime(df["Date"],errors="coerce")
    return df.sort_values("Date")

df=load()

# safe numeric conversion
for col in df.columns:
    if col not in ["Date","Player","Role","Agent"]:
        df[col]=pd.to_numeric(df[col],errors="coerce")

# stat normalization to 0-10
def rate(stat,val):
    if pd.isna(val): return np.nan
    if stat in ["Aim","Utility","Comms","Entry","Clutch"]: return val
    if stat=="HS%": return np.clip((val-10)/(40-10)*10,0,10)
    if stat=="ACS": return np.clip((val-120)/(300-120)*10,0,10)
    if stat=="KD": return np.clip((val-0.6)/(1.6-0.6)*10,0,10)
    return np.nan

metrics=["Aim","Utility","Comms","Entry","Clutch","HS%","ACS","KD"]

norm=df.copy()
for m in metrics:
    if m in norm.columns:
        norm[m]=norm[m].apply(lambda x:rate(m,x))

norm["Overall"]=norm[metrics].mean(axis=1)

# =========================================================
# PLAYER
# =========================================================
player=st.selectbox("Player",norm["Player"].dropna().unique())
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
c1.plotly_chart(gauge("Performance",career),use_container_width=True)
c2.plotly_chart(gauge("Consistency",consistency),use_container_width=True)
c3.plotly_chart(gauge("Form",form),use_container_width=True)
c4.plotly_chart(gauge("Impact",impact),use_container_width=True)
st.markdown("</div>",unsafe_allow_html=True)

# =========================================================
# PERFORMANCE BREAKDOWN
# =========================================================
st.markdown('<div class="card"><div class="section-title">Performance Breakdown</div>',unsafe_allow_html=True)

plot=pn.tail(10)
long=plot.melt(id_vars="Date",value_vars=metrics,var_name="Metric",value_name="Score").dropna()
fig=px.line(long,x="Date",y="Score",color="Metric",markers=True)
fig.update_yaxes(range=[0,10])
fig.update_layout(paper_bgcolor="rgba(0,0,0,0)",plot_bgcolor="rgba(0,0,0,0)",font_color="white")
st.plotly_chart(fig,use_container_width=True)
st.markdown("</div>",unsafe_allow_html=True)

# =========================================================
# MATCH LOGS
# =========================================================
st.markdown('<div class="card"><div class="section-title">Match Logs</div>',unsafe_allow_html=True)
for d,g in pn.groupby(pn["Date"].dt.date):
    with st.expander(str(d)):
        st.dataframe(g[["Role","Overall"]+metrics],use_container_width=True)
st.markdown("</div>",unsafe_allow_html=True)

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

# Controllers
"omen":"https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png",
"brimstone":"https://media.valorant-api.com/agents/9f0d8ba9-4140-b941-57d3-a7ad57c6b417/displayicon.png",
"viper":"https://media.valorant-api.com/agents/707eab51-4836-f488-046a-cda6bf494859/displayicon.png",
"astra":"https://media.valorant-api.com/agents/41fb69c1-4189-7b37-f117-bcaf1e96f1bf/displayicon.png",
"harbor":"https://media.valorant-api.com/agents/95b78ed7-4637-86d9-7e41-71ba8c293152/displayicon.png",

# Initiators
"sova":"https://media.valorant-api.com/agents/320b2a48-4d9b-a075-30f1-1f93a9b638fa/displayicon.png",
"breach":"https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-13acf203c006/displayicon.png",
"skye":"https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/displayicon.png",
"kay/o":"https://media.valorant-api.com/agents/601dbbe7-43ce-be57-2a40-4abd24953621/displayicon.png",
"fade":"https://media.valorant-api.com/agents/d17320a9-4e19-b3d0-3cbb-3f6b8a4b98c3/displayicon.png",
"gekko":"https://media.valorant-api.com/agents/e370fa57-4757-3604-3648-499e1f642d3f/displayicon.png",

# Sentinels
"sage":"https://media.valorant-api.com/agents/569fdd95-4d10-43ab-ca70-79becc718b46/displayicon.png",
"cypher":"https://media.valorant-api.com/agents/117ed9e3-49f3-6512-3ccf-0cada7e3823b/displayicon.png",
"killjoy":"https://media.valorant-api.com/agents/1dbf2edd-4729-0984-3115-daa5eed44993/displayicon.png",
"chamber":"https://media.valorant-api.com/agents/22697a3d-45bf-8dd7-4fec-84a9e28c69d7/displayicon.png",
"deadlock":"https://media.valorant-api.com/agents/cc8b64c8-4b25-4ff9-6e7f-37b4da43d235/displayicon.png"
}
def agent_img(agent):
    if pd.isna(agent): return ""
    return AGENT_IMAGES.get(str(agent).lower().strip(),"")

# =========================================================
# TEAM RANK
# =========================================================
st.markdown('<div class="card"><div class="section-title">Team Rankings</div>',unsafe_allow_html=True)

rank=norm.groupby("Player")["Overall"].mean().sort_values(ascending=False)

for i,(p,s) in enumerate(rank.items(),1):
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











