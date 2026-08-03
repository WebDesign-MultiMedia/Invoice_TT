"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";

const WIDTH = 320;
const HEIGHT = 300;
const RADIUS = Math.min(WIDTH, HEIGHT - 40) / 2;
const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#64748b"];

export default function PaymentMethodDonut({ data }) {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    if (!data || data.length === 0) {
      svg
        .append("text")
        .attr("x", WIDTH / 2)
        .attr("y", HEIGHT / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "#64748b")
        .attr("font-size", 13)
        .text("No payment data yet");
      return;
    }

    const g = svg.append("g").attr("transform", `translate(${WIDTH / 2},${(HEIGHT - 40) / 2 + 8})`);

    const color = d3.scaleOrdinal().domain(data.map((d) => d.status)).range(COLORS);

    const pie = d3
      .pie()
      .value((d) => d.count)
      .sort(null);
    const arc = d3.arc().innerRadius(RADIUS * 0.6).outerRadius(RADIUS);
    const labelArc = d3.arc().innerRadius(RADIUS * 0.8).outerRadius(RADIUS * 0.8);

    const arcs = pie(data);

    g.selectAll("path")
      .data(arcs)
      .join("path")
      .attr("d", arc)
      .attr("fill", (d) => color(d.data.status))
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 2);

    g.selectAll(".arc-label")
      .data(arcs)
      .join("text")
      .attr("transform", (d) => `translate(${labelArc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .attr("fill", "#f1f5f9")
      .attr("font-size", 11)
      .attr("font-weight", 600)
      .text((d) => d.data.count);

    const total = d3.sum(data, (d) => d.count);
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.2em")
      .attr("fill", "#f1f5f9")
      .attr("font-size", 20)
      .attr("font-weight", 700)
      .text(total);
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1.2em")
      .attr("fill", "#64748b")
      .attr("font-size", 11)
      .text("invoices");

    const legend = svg.append("g").attr("transform", `translate(8, ${HEIGHT - 28})`);

    const legendItems = legend
      .selectAll("g")
      .data(data)
      .join("g")
      .attr("transform", (_, i) => `translate(${i * (WIDTH / data.length)}, 0)`);

    legendItems.append("rect").attr("width", 10).attr("height", 10).attr("rx", 2).attr("fill", (d) => color(d.status));

    legendItems
      .append("text")
      .attr("x", 14)
      .attr("y", 9)
      .attr("fill", "#94a3b8")
      .attr("font-size", 10)
      .text((d) => d.status);
  }, [data]);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="mx-auto h-auto w-full max-w-xs"
      role="img"
      aria-label="Invoices by payment method"
    />
  );
}
