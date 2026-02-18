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
.card{background:rgba(20,20,25,.65);border:1px solid rgba(255,70,85,.4);
border-radius:8px;padding:18px;margin-bottom:18px;backdrop-filter:blur(6px);}
.section-title{font-size:18px;color:#ff4655;margin-bottom:14px;font-weight:700;}
.rankrow{display:flex;align-items:center;gap:14px;padding:10px;margin-bottom:8px;background:rgba(255,255,255,.03);border-radius:6px}
.rankrow img{height:46px;border-radius:4px}
</style>
""", unsafe_allow_html=True)

st.markdown("<h1 style='color:white'>Game Drifters Valorant Team</h1>", unsafe_allow_html=True)

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
        number={'suffix':" /10",'font':{'size':34}},
        title={'text':title,'font':{'color':'#ff4655'}},
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
AGENT_IMAGES={
"omen":"https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png",
"jett":"https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png",
"breach":"https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-13acf203c006/displayicon.png",
"neon":"https://media.valorant-api.com/agents/bb2a4828-46eb-8cd1-e765-15848195d751/displayicon.png"
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


