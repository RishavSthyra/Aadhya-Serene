"use client";
import { useEffect, useMemo, useState } from "react";

export default function ApartmentsPage(){
  const [flats,setFlats]=useState([]);
  const [type,setType]=useState(null),[facing,setFacing]=useState(null),[floor,setFloor]=useState(null),[bal,setBal]=useState(null);
  const [avail,setAvail]=useState(false),[withBal,setWithBal]=useState(false);
  const [minArea,setMinArea]=useState(1001),[maxArea,setMaxArea]=useState(1498);

  useEffect(()=>{fetch('/apartments-data.json').then(r=>r.json()).then(d=>{setFlats(d.flatsData||[]); const areas=(d.flatsData||[]).map(x=>x.area); if(areas.length){setMinArea(Math.min(...areas)); setMaxArea(Math.max(...areas));}})},[]);

  const rows=useMemo(()=>flats
    .filter(f=> floor===null?true:Number(f.flat[0])===(floor==='G'?0:Number(floor)))
    .filter(f=> type===null||f.type===type)
    .filter(f=> facing===null||f.facing===facing)
    .filter(f=> !withBal || f.balconies>0)
    .filter(f=> !avail || f.status==='available')
    .filter(f=> bal===null || f.balconies===bal)
    .filter(f=> f.area>=minArea && f.area<=maxArea),
  [flats,type,facing,floor,withBal,avail,bal,minArea,maxArea]);

  const pill=(vals,active,setter)=><div className="pills">{vals.map(v=><button key={String(v)} className={`pill ${active===v?'active':''}`} onClick={()=>setter(active===v?null:v)}>{v}</button>)}</div>

  return <main className="layout">
    <aside className="filters">
      <h2>FILTER APARTMENTS</h2>
      <section><label>TYPE</label>{pill(['2 BHK','3 BHK'],type,setType)}</section>
      <section><label>FACING</label>{pill(['east','west','north'],facing,setFacing)}</section>
      <section><label>FLOOR</label>{pill(['G','1','2','3','4','5','6'],floor,setFloor)}</section>
      <section><label>AREA (sqft)</label><div className="range"><input type="number" value={minArea} onChange={e=>setMinArea(Number(e.target.value||0))}/><span>to</span><input type="number" value={maxArea} onChange={e=>setMaxArea(Number(e.target.value||0))}/></div></section>
      <section><label>NUMBER OF BALCONIES</label>{pill([1,2,3],bal,setBal)}</section>
      <section><label><input type="checkbox" checked={avail} onChange={e=>setAvail(e.target.checked)}/> AVAILABLE FLATS</label><label><input type="checkbox" checked={withBal} onChange={e=>setWithBal(e.target.checked)}/> FLATS WITH BALCONY</label></section>
      <button className="reset" onClick={()=>{setType(null);setFacing(null);setFloor(null);setBal(null);setAvail(false);setWithBal(false);const areas=flats.map(x=>x.area); if(areas.length){setMinArea(Math.min(...areas)); setMaxArea(Math.max(...areas));}}}>RESET</button>
    </aside>
    <section className="cardsWrap">
      <div className="count">{rows.length} APARTMENTS FOUND</div>
      <div className="cards">{rows.map(f=><article key={f.flat} className="card"><h3>Flat {f.flat}</h3><p>{f.type} • {f.area} sqft • {f.facing} • Floor {f.flat[0]==='0'?'G':f.flat[0]}{f.balconies?` • ${f.balconies} balconies`:''}</p><a href={`https://aadhyaserene.com/apartments/${f.flat}`} target="_blank">View Details</a></article>)}</div>
    </section>
  </main>
}
