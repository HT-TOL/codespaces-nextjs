import Head from 'next/head'
import AuthPanel from '../components/AuthPanel'

const projects = [
  { name: 'codespaces-ocodejs', owner: 'zskbot', branch: 'main', stack: 'Next.js 16 · React', status: 'Template', color: '#8b5cf6', updated: 'Starter environment' },
  { name: 'ocodejs-cli', owner: 'zskbot', branch: 'main', stack: 'CLI · TypeScript', status: 'Connect repository', color: '#2f6bff', updated: 'OCodeJS developer tools' },
  { name: 'ask-ocodejs', owner: 'zskbot', branch: 'main', stack: 'Vite · AI workspace', status: 'Connect repository', color: '#16a085', updated: 'AI builder' },
]

const templates = [
  { name: 'Next.js', detail: 'Full-stack React framework', icon: 'N', color: '#ffffff' },
  { name: 'React + Vite', detail: 'Fast frontend development', icon: '⚛', color: '#61dafb' },
  { name: 'Node.js', detail: 'Backend and API services', icon: '⬡', color: '#75b85b' },
  { name: 'Python', detail: 'Automation and AI projects', icon: 'Py', color: '#f4c64e' },
]

export default function Home() {
  return (
    <>
      <Head>
        <title>OCodeJS Codespaces — Cloud Development</title>
        <meta name="description" content="OCodeJS branded cloud development workspaces." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#05070f" />
      </Head>
      <div className="app-shell">
        <aside className="sidebar">
          <a className="brand" href="#">
            <span className="brand-mark">O</span>
            <span>OCODE<span className="brand-muted">JS</span><small>CODESPACES</small></span>
          </a>
          <div className="side-label">WORKSPACE</div>
          <a className="nav-item active" href="#overview"><span>▦</span> Overview</a>
          <a className="nav-item" href="#projects"><span>◫</span> Projects</a>
          <a className="nav-item" href="#templates"><span>▤</span> Templates</a>
          <a className="nav-item" href="#environments"><span>⌘</span> Environments</a>
          <div className="side-label side-spaced">DEVELOPMENT</div>
          <a className="nav-item" href="https://github.com/codespaces" target="_blank" rel="noreferrer"><span>⌁</span> GitHub Codespaces ↗</a>
          <a className="nav-item" href="https://github.com/zskbot" target="_blank" rel="noreferrer"><span>⌂</span> Repositories ↗</a>
          <div className="sidebar-bottom">
            <div className="runtime-card">
              <span className="runtime-dot" />
              <div><b>Runtime provider</b><small>External workspace provider</small></div>
            </div>
            <div className="profile"><div className="avatar">Z</div><div><b>OCodeJS Developer</b><small>Sign in to connect account</small></div><span className="more">···</span></div>
          </div>
        </aside>

        <main className="main" id="overview">
          <header className="topbar">
            <div className="breadcrumb">OCODEJS <span>/</span> WORKSPACE</div>
            <div className="top-actions"><span className="connection"><i /> Provider hand-off only</span><a className="icon-button" href="https://github.com/zskbot/codespaces-ocodejs" target="_blank" rel="noreferrer" aria-label="Source repository">↗</a><div className="avatar small">Z</div></div>
          </header>

          <section className="welcome">
            <div>
              <div className="eyebrow"><span className="eyebrow-line" /> CLOUD DEVELOPMENT ENVIRONMENT</div>
              <h1>Your code.<br /><em>Your space.</em></h1>
              <p className="intro">A focused cloud workspace for building, testing, and shipping software across the OCodeJS ecosystem.</p>
              <div className="hero-actions">
                <a className="primary-button" href="https://github.com/codespaces" target="_blank" rel="noreferrer">Open Codespaces <span>↗</span></a>
                <a className="secondary-button" href="https://github.com/zskbot" target="_blank" rel="noreferrer">Browse repositories</a>
              </div>
            </div>
            <div className="hero-art" aria-hidden="true">
              <div className="art-grid" />
              <div className="terminal-window">
                <div className="terminal-head"><span /><span /><span /><label>ocodejs — workspace</label></div>
                <div className="terminal-body"><p><i>~/workspace</i> <b>$</b> npm run dev</p><p className="terminal-muted">▲ Next.js development server</p><p className="terminal-green">✓ Ready on localhost:3000</p><p className="terminal-cursor">_</p></div>
              </div>
              <div className="art-tag">BUILD / PREVIEW / SHIP</div>
            </div>
          </section>

          <AuthPanel />

          <section className="stats">
            <div><small>PLATFORM</small><b>OCodeJS Cloud IDE</b></div>
            <div><small>WORKSPACE RUNTIME</small><b>GitHub hand-off</b></div>
            <div><small>ENVIRONMENT</small><b><span className="status-dot" /> Preview foundation</b></div>
          </section>

          <section className="section" id="projects">
            <div className="section-heading"><div><div className="eyebrow">YOUR DEVELOPMENT</div><h2>Recent projects</h2></div><a href="https://github.com/zskbot?tab=repositories" target="_blank" rel="noreferrer" className="text-link">All repositories ↗</a></div>
            <div className="project-grid">
              {projects.map((project) => (
                <article className="project-card" key={project.name}>
                  <div className="project-top"><div className="project-icon" style={{ '--project-color': project.color }}>{project.name.slice(0, 1).toUpperCase()}</div><span className="project-status">{project.status}</span></div>
                  <h3>{project.name}</h3><p className="owner">{project.owner} / {project.name}</p>
                  <div className="project-meta"><span>⑂ {project.branch}</span><span>{project.stack}</span></div>
                  <div className="project-bottom"><span>{project.updated}</span><a href={`https://github.com/${project.owner}/${project.name}`} target="_blank" rel="noreferrer">Open repo ↗</a></div>
                </article>
              ))}
            </div>
          </section>

          <section className="section templates-section" id="templates">
            <div className="section-heading"><div><div className="eyebrow">START SOMETHING NEW</div><h2>Start from a template</h2></div><span className="muted-note">More runtimes coming</span></div>
            <div className="template-grid">
              {templates.map((template) => <a className="template-card" href="https://github.com/codespaces" target="_blank" rel="noreferrer" key={template.name}><span className="template-icon" style={{ color: template.color }}>{template.icon}</span><span><b>{template.name}</b><small>{template.detail}</small></span><span className="template-arrow">↗</span></a>)}
            </div>
          </section>

          <footer><span>© 2026 OCODEJS</span><span>DESIGNED FOR DEVELOPERS <b>·</b> BUILT IN THE CLOUD</span><a href="https://github.com/zskbot/codespaces-ocodejs" target="_blank" rel="noreferrer">SOURCE ↗</a></footer>
        </main>
      </div>
      <style jsx global>{`
        *{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#05070f;color:#f3f5fb;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.app-shell{min-height:100vh;display:flex;background:#05070f}.sidebar{width:246px;flex:0 0 246px;border-right:1px solid #202432;padding:25px 17px 18px;display:flex;flex-direction:column;min-height:100vh;position:sticky;top:0;height:100vh}.brand{display:flex;align-items:center;gap:11px;color:#fff;text-decoration:none;font:700 15px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:1px;padding:0 8px 34px}.brand-mark{width:34px;height:34px;border:1px solid #fff;display:grid;place-items:center;font-size:21px}.brand-muted{color:#8a91a4}.brand small{display:block;color:#81899b;font-size:9px;letter-spacing:2px;margin-top:4px}.side-label{font:10px ui-monospace,monospace;color:#70788b;letter-spacing:1.5px;padding:0 10px 10px}.side-spaced{margin-top:29px}.nav-item{height:40px;display:flex;align-items:center;gap:12px;padding:0 11px;color:#9da5b7;text-decoration:none;font-size:13px;border:1px solid transparent}.nav-item span{width:16px;text-align:center;color:#8790a4;font-size:16px}.nav-item.active{background:#111827;border-color:#27334b;color:#fff}.nav-item.active span{color:#8caaff}.sidebar-bottom{margin-top:auto}.runtime-card{display:flex;gap:10px;align-items:center;border:1px solid #252c3b;padding:12px;margin-bottom:17px}.runtime-dot,.connection i,.status-dot{width:7px;height:7px;border-radius:50%;background:#6b7890;display:inline-block}.runtime-card b,.profile b{display:block;font-size:11px;font-weight:600}.runtime-card small,.profile small{display:block;color:#7e879a;font-size:10px;margin-top:4px}.profile{border-top:1px solid #202432;padding:17px 3px 0;display:flex;align-items:center;gap:9px}.avatar{width:29px;height:29px;background:#202d49;border:1px solid #40527a;display:grid;place-items:center;font:12px ui-monospace,monospace}.avatar.small{width:27px;height:27px}.more{margin-left:auto;color:#8b93a5}.main{min-width:0;flex:1;padding:0 42px;max-width:1600px;margin:0 auto}.topbar{height:67px;border-bottom:1px solid #202432;display:flex;align-items:center;justify-content:space-between}.breadcrumb{font:10px ui-monospace,monospace;letter-spacing:1.3px;color:#e3e7f0}.breadcrumb span{color:#596174;padding:0 9px}.top-actions{display:flex;align-items:center;gap:15px}.connection{font-size:11px;color:#9ba4b6;display:flex;align-items:center;gap:8px}.connection i{width:6px;height:6px}.icon-button{width:29px;height:29px;border:1px solid #30394b;display:grid;place-items:center;color:#b9c2d4;text-decoration:none}.welcome{display:grid;grid-template-columns:1.05fr .95fr;gap:25px;align-items:center;padding:62px 0 42px;min-height:360px}.eyebrow{font:10px ui-monospace,monospace;letter-spacing:1.6px;color:#8b9dc4}.eyebrow-line{display:inline-block;width:19px;height:1px;background:#6689e9;vertical-align:middle;margin-right:8px}.welcome h1{font:500 clamp(43px,5.3vw,68px)/1.02 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:-4px;margin:22px 0 15px}.welcome h1 em{font-style:normal;color:#7698ff}.intro{max-width:470px;color:#9ca5b8;font-size:14px;line-height:1.8;margin:0}.hero-actions{display:flex;gap:10px;margin-top:25px;flex-wrap:wrap}.primary-button,.secondary-button{height:42px;padding:0 17px;display:inline-flex;align-items:center;gap:20px;text-decoration:none;font-size:12px;font-weight:600}.primary-button{background:#f3f5fb;color:#080b13}.primary-button span{font-size:16px}.secondary-button{border:1px solid #343c4e;color:#d9deea}.hero-art{height:255px;position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden}.art-grid{position:absolute;inset:0;background-image:linear-gradient(#1c2638 1px,transparent 1px),linear-gradient(90deg,#1c2638 1px,transparent 1px);background-size:26px 26px;opacity:.45;mask-image:linear-gradient(90deg,transparent,#000 25%,#000 75%,transparent)}.terminal-window{position:relative;width:min(100%,390px);background:#0b101b;border:1px solid #35415a;box-shadow:0 18px 55px #0009;transform:rotate(-2deg)}.terminal-head{height:34px;border-bottom:1px solid #283247;display:flex;align-items:center;gap:6px;padding:0 12px}.terminal-head>span{width:6px;height:6px;border-radius:50%;background:#59647a}.terminal-head label{margin-left:8px;color:#7f8ba3;font:9px ui-monospace,monospace}.terminal-body{padding:20px 18px 23px;font:11px ui-monospace,monospace;line-height:1.9;color:#d9dfed}.terminal-body p{margin:0 0 5px}.terminal-body i{color:#8ea9ff;font-style:normal}.terminal-body b{color:#fff}.terminal-muted{color:#8490a6}.terminal-green{color:#58d69a}.terminal-cursor{color:#9bb3ff}.art-tag{position:absolute;right:0;bottom:10px;color:#6f7e9c;font:9px ui-monospace,monospace;letter-spacing:1.7px}.stats{display:grid;grid-template-columns:repeat(3,1fr);border-top:1px solid #222a3a;border-bottom:1px solid #222a3a;padding:17px 0;margin-bottom:48px}.stats>div{padding:0 20px;border-right:1px solid #252d3d}.stats>div:first-child{padding-left:0}.stats>div:last-child{border:0}.stats small{display:block;color:#778197;font:9px ui-monospace,monospace;letter-spacing:1px;margin-bottom:8px}.stats b{font-size:12px;font-weight:500;color:#dce2ee}.stats .status-dot{width:6px;height:6px;margin-right:5px}.section{margin-bottom:48px}.section-heading{display:flex;align-items:end;justify-content:space-between;margin-bottom:17px}.section-heading h2{font:500 22px ui-monospace,monospace;letter-spacing:-.8px;margin:8px 0 0}.text-link{color:#9eb4ff;text-decoration:none;font-size:11px}.project-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.project-card{border:1px solid #293144;background:#090d17;padding:17px;min-width:0}.project-top{display:flex;justify-content:space-between;align-items:center}.project-icon{width:31px;height:31px;display:grid;place-items:center;border:1px solid var(--project-color);color:var(--project-color);font:14px ui-monospace,monospace}.project-status{font:9px ui-monospace,monospace;color:#8d98ad;border:1px solid #30394a;padding:5px 7px}.project-card h3{font:14px ui-monospace,monospace;margin:17px 0 5px;overflow-wrap:anywhere}.owner{font-size:10px;color:#778197;margin:0 0 16px}.project-meta{display:flex;gap:10px;flex-wrap:wrap;border-top:1px solid #202839;padding-top:12px;color:#929db2;font-size:10px}.project-bottom{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-top:15px;color:#727d91;font-size:9px}.project-bottom a{color:#a9bcff;text-decoration:none;font-size:10px}.templates-section{margin-bottom:40px}.muted-note{font-size:10px;color:#778197}.template-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.template-card{display:flex;align-items:center;gap:10px;min-width:0;padding:13px;border:1px solid #293144;color:#e6eaf3;text-decoration:none}.template-card:hover,.project-card:hover{border-color:#647eb8}.template-icon{width:28px;font:16px ui-monospace,monospace;text-align:center}.template-card b{display:block;font-size:11px}.template-card small{display:block;color:#7e899e;font-size:9px;margin-top:5px}.template-arrow{margin-left:auto;color:#8996ae;font-size:13px}footer{border-top:1px solid #202432;padding:19px 0 24px;display:flex;justify-content:space-between;gap:12px;color:#6f798d;font:9px ui-monospace,monospace;letter-spacing:1px}footer b{color:#7e9cff}footer a{color:#9eafd8;text-decoration:none}@media(max-width:1050px){.main{padding:0 25px}.sidebar{width:215px;flex-basis:215px}.project-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.template-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:720px){.sidebar{display:none}.main{padding:0 17px}.topbar{height:57px}.connection{font-size:0;gap:0}.connection i{width:7px;height:7px}.welcome{grid-template-columns:1fr;padding:43px 0 30px;gap:5px}.welcome h1{font-size:49px;letter-spacing:-3px}.intro{font-size:13px}.hero-art{height:190px}.terminal-window{width:88%}.stats{grid-template-columns:1fr;gap:14px;margin-bottom:36px}.stats>div,.stats>div:first-child{border:0;padding:0}.stats small{margin-bottom:4px}.section-heading h2{font-size:19px}.project-grid{grid-template-columns:1fr}.template-grid{grid-template-columns:1fr 1fr}.template-card{padding:11px 8px;gap:7px}.template-card small{line-height:1.4}.project-card{padding:15px}footer{flex-wrap:wrap;font-size:8px}footer span:nth-child(2){order:3;width:100%}}@media(max-width:380px){.template-grid{grid-template-columns:1fr}.hero-actions a{width:100%;justify-content:space-between}}
      `}</style>
    </>
  )
}
