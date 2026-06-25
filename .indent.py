from pathlib import Path
p = Path("app.py")
src = p.read_text(encoding="utf-8")

start_marker = "with tab_pred:\n"
end_marker = '\nst.markdown("---")\nst.header("2 · Rendimiento del modelo")'

i = src.index(start_marker) + len(start_marker)
j = src.index(end_marker)
block = src[i:j]

lines = block.split("\n")
indented = []
for ln in lines:
    if ln.strip() == "":
        indented.append("")
    else:
        indented.append("    " + ln)
new_block = "\n".join(indented)

perf_start = src.index('\nst.markdown("---")\nst.header("2 · Rendimiento del modelo")')
perf_block = src[perf_start:]
perf_block_clean = perf_block.replace(
    '\nst.markdown("---")\nst.header("2 · Rendimiento del modelo")',
    "\n\nwith tab_perf:",
    1
)
perf_lines = perf_block_clean.split("\n")
perf_out = []
inside = False
for ln in perf_lines:
    if ln.startswith("with tab_perf:"):
        perf_out.append(ln)
        inside = True
        continue
    if inside:
        if ln.strip() == "":
            perf_out.append("")
        else:
            perf_out.append("    " + ln)
    else:
        perf_out.append(ln)
perf_new = "\n".join(perf_out)

new_src = src[:i] + new_block + perf_new
p.write_text(new_src, encoding="utf-8")
print("done")
