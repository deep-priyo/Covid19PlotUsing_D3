import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import axios from 'axios';

const CovidLineChart = () => {
    const svgRef = useRef();
    const containerRef = useRef();
    //useState to hold chart data
    const [data, setData] = useState([]);
    //to store the current device dimensions for mobile responsiveness 
    const [d, setD] = useState({width: 0, height: 0});

    //function to update dimension according to the device dimensions
    const updateDimension = () => {
        const width = containerRef.current.clientWidth;
        const height = Math.max(300, width * 0.5);
        setD({ width, height });
    };

    //dynamically adjusting dimensions
    useEffect(() => {
        //sets dimension on component mounts first time
        updateDimension();
        //to change dimensions on resize of window
        window.addEventListener("resize", updateDimension);
    }, []);

    //fetching data disease.sh api
    useEffect(() => {
        const fetchData = async () => {
            const { data } = await axios.get("https://disease.sh/v3/covid-19/historical/India?lastdays=all");
            const time = data.timeline.cases;

            // I wanted to have daily data, so I converted it from cumulative data using these function
            const dailyData = Object.entries(time).map(([date, cases], i, arr) => ({
                date: d3.timeParse("%m/%d/%y")(date),
                cases,
                dailyCases: i ? cases - arr[i - 1][1] : 0
            }));
            setData(dailyData);
        };
        fetchData();
    }, []);

    //creating chart within svg inside div
    useEffect(() => {
        // prevent duplicate SVG on re-render
        d3.select(svgRef.current).select('svg').remove();

        // padding calculation
        const margin = {
            top: Math.max(20, d.height * 0.2),
            right: Math.max(15, d.width * 0.05),
            bottom: Math.max(30, d.height * 0.1),
            left: Math.max(40, d.width * 0.08)
        };
        // actual area of the chart
        const width = d.width - margin.left - margin.right;
        const height = d.height - margin.top - margin.bottom;

        // creaitng SVG eleemnt
        const svg = d3.select(svgRef.current)
            .append('svg')
            .attr('width', '100%')// takes 85% of parent
            .attr('height', d.height)
            .attr('viewBox', `0 0 ${d.width} ${d.height}`)
            .attr('preserveAspectRatio', 'xMinYMin meet')
            .attr('class', 'bg-white')
                        .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // clip path so that lines do not go beyond graph area
        svg.append("defs").append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height)


        // x-axis and y-axis scales
        const x = d3.scaleTime().range([0, width]);
        const y = d3.scaleLinear().range([height, 0]);
        // finding min and max data points to setup up the scale
        x.domain(d3.extent(data, d => d.date));
        y.domain([0, d3.max(data, d => d.dailyCases)]);

        //line generator
        const line = d3.line()
            .x(d => x(d.date))
            .y(d => y(d.dailyCases));


        const chartArea = svg.append("g")
            .attr("clip-path", "url(#clip)");

        // drawing the path
        const path = chartArea.append('path')
            .datum(data)
            .attr('fill', 'none')
            .attr('stroke', '#BF3131') // path color
            .attr('stroke-width', 2)
            .attr('d', line);

        // hover pointer
        const circle = chartArea.append('circle')
            .attr("r", 0)
            .attr("fill", "#7D0A0A")  // pointer color
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .attr('opacity', 0.7);

        //  tick counts
        const xTickCount = Math.max(2, Math.floor(width / 100));
        const yTickCount = Math.max(3, Math.floor(height / 50));


        const xAxis = svg.append('g')
            .attr('class', 'x-axis text-gray-700')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x)
                .ticks(xTickCount)
                .tickFormat(d => {

                    return d.width < 500 ?
                        d3.timeFormat('%b')(d) :
                        d3.timeFormat('%b %Y')(d);
                }));

        const yAxis = svg.append('g')
            .attr('class', 'y-axis text-gray-700')
            .call(d3.axisLeft(y)
                .ticks(yTickCount)
                .tickFormat(d => {
                    // Responsive tick format
                    return d.width < 500 ?
                        `${Math.round(d / 1000)}K` :
                        `${(d / 1000).toFixed(1)}K`;
                }));

        // Style the axes
        svg.selectAll(".domain, .tick line")
            .attr("stroke", "#205781"); // axes color

        svg.selectAll(".tick text")
            .attr("fill", "#205781");// axes label color


        const xGridLines = svg.append("g")
            .attr("class", "grid-lines x-grid")
            .attr("transform", `translate(0,${height})`);

        xGridLines.call(d3.axisBottom(x)
            .ticks(xTickCount)
            .tickSize(-height)
            .tickFormat("")
        )
            .selectAll("line")
            .attr("stroke", "#666262")
            .attr("stroke-dasharray", "3,3");

        const yGridLines = svg.append("g")
            .attr("class", "grid-lines y-grid");

        yGridLines.call(d3.axisLeft(y)
            .ticks(yTickCount)
            .tickSize(-width)
            .tickFormat("")
        )
            .selectAll("line")
            .attr("stroke", "#666262")
            .attr("stroke-dasharray", "3,3");

        // hiding the  grid axes
        svg.selectAll(".grid-lines .domain")
            .attr("stroke", "none");

        //  gradient for graph
        const gradientId = "line-gradient";
        const gradient = svg.append("defs")
            .append("linearGradient")
            .attr("id", gradientId)
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", width)
            .attr("y2", 0);

        gradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#d6a7b4"); // graideent color

        gradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#d6a7b4"); // graideent color


        const area = d3.area()
            .x(d => x(d.date))
            .y0(height)
            .y1(d => y(d.dailyCases))
            .curve(d3.curveMonotoneX); // Make the line smoother

        chartArea.append("path")
            .datum(data)
            .attr("fill", "url(#" + gradientId + ")")
            .attr("fill-opacity", 0.1)
            .attr("d", area);


        // text part
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', -margin.top / 1.5)
            .attr('text-anchor', 'middle')
            .attr('class','font-bold')
            .style('font-size', '18px')
            .text('COVID-19 Daily Cases in India (2020-2023)');
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', -margin.top / 2.1)
            .attr('text-anchor', 'middle')
            .attr('class','font-light')
            .style('font-size', '12px')
            .text('These Graph Shows The Number Of Cases Recorded Per Day');
        if (d.width > 500) {
            svg.append('text')
                .attr('x', width / 2)
                .attr('y', height + 40)
                .attr('text-anchor', 'middle')
                .style('font-size', '12px')
                .text('Scroll to zoom, drag to pan');
        }


        //  reset zoom button
        const buttonWidth = Math.max(60, Math.min(80, d.width * 0.1));
        const buttonHeight = Math.max(20, Math.min(25, d.height * 0.05));
        const buttonX = width - buttonWidth;
        const buttonY = -margin.top / 2 - buttonHeight / 2;

        const resetButton = svg.append('g')
            .attr('transform', `translate(${buttonX},${buttonY})`)
            .attr('class', 'cursor-pointer');

        resetButton.append('rect')
            .attr('width', buttonWidth)
            .attr('height', buttonHeight)
            .attr('rx', 5)
            .attr('class', 'fill-blue-500');

        resetButton.append('text')
            .attr('x', buttonWidth / 2)
            .attr('y', buttonHeight / 2 + 5)
            .attr('text-anchor', 'middle')
            .attr('class', 'fill-white font-medium')
            .style('font-size', d.width < 500 ? '10px' : '12px')
            .text('Reset Zoom');

        //zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([1, 20])
            .extent([[0, 0], [width, height]])
            .on("zoom", zoomed);

        svg.call(zoom);


        const listeningRect = chartArea.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "transparent");

        // tooltip functionality
        const isTouchDevice = 'ontouchstart' in window;

        if (isTouchDevice) {

            listeningRect.on("touchstart", handleTouch);
        } else {

            listeningRect.on("mousemove", handleMouse);
            listeningRect.on("mouseleave", handlemouseexit);
        }

        function handleTouch(event) {
            event.preventDefault();
            const touch = event.touches[0];
            updateTooltip(touch);
        }

        function handleMouse(event) {
            updateTooltip(event);
        }

        function handlemouseexit() {
            circle.transition()
                .duration(50)
                .attr("r", 0);

            d3.select('.covid-tooltip')
                .style("display", "none");
        }

        function updateTooltip(event) {
            const [xCoord] = d3.pointer(event, this);
            const bisectDate = d3.bisector(d => d.date).left;
            const x0 = x.invert(xCoord);
            const i = bisectDate(data, x0, 1);

            if (i >= data.length || i <= 0) return;

            const d0 = data[i - 1];
            const d1 = data[i];

            if (!d0 || !d1) return;

            const d = x0 - d0.date > d1.date - x0 ? d1 : d0;

            const xPos = x(d.date);
            const yPos = y(d.dailyCases);

            circle.attr("cx", xPos)
                .attr("cy", yPos);

            circle.transition()
                .duration(50)
                .attr("r", 5);

            const tooltipText = `<strong>Date:</strong> ${d.date.toLocaleDateString()}<br>
                               <strong>Daily Cases:</strong> ${d.dailyCases.toLocaleString()}`;


            const tooltipX = event.pageX + 15;
            const tooltipY = event.pageY - 30;


            const tooltip = d3.select('.covid-tooltip');
            tooltip
                .style("display", "block")
                .style("left", `${tooltipX}px`)
                .style("top", `${tooltipY}px`)
                .html(tooltipText);
        }


        function zoomed(event) {

            const newX = event.transform.rescaleX(x);
            const newY = event.transform.rescaleY(y);


            xAxis.call(d3.axisBottom(newX)
                .ticks(xTickCount)
                .tickFormat(d => {
                    return d.width < 500 ?
                        d3.timeFormat('%b')(d) :
                        d3.timeFormat('%b %Y')(d);
                }));

            yAxis.call(d3.axisLeft(newY)
                .ticks(yTickCount)
                .tickFormat(d => {
                    return d.width < 500 ?
                        `${Math.round(d / 1000)}K` :
                        `${(d / 1000).toFixed(1)}K`;
                }));


            svg.selectAll(".domain, .tick line")
                .attr("stroke", "#9ca3af");

            svg.selectAll(".tick text")
                .attr("fill", "#374151");


            path.attr("d", d3.line()
                .x(d => newX(d.date))
                .y(d => newY(d.dailyCases))
            );


            if (isTouchDevice) {
                listeningRect.on("touchstart", function (event) {
                    event.preventDefault();
                    const touch = event.touches[0];
                    updateTooltipWithScales(touch, newX, newY);
                });
            } else {
                listeningRect.on("mousemove", function (event) {
                    updateTooltipWithScales(event, newX, newY);
                });
            }
        }

        function updateTooltipWithScales(event, scaleX, scaleY) {
            const [xCoord] = d3.pointer(event, this);
            const bisectDate = d3.bisector(d => d.date).left;
            const x0 = scaleX.invert(xCoord);
            const i = bisectDate(data, x0, 1);

            if (i >= data.length || i <= 0) return;

            const d0 = data[i - 1];
            const d1 = data[i];

            if (!d0 || !d1) return;

            const d = x0 - d0.date > d1.date - x0 ? d1 : d0;

            const xPos = scaleX(d.date);
            const yPos = scaleY(d.dailyCases);

            circle.attr("cx", xPos)
                .attr("cy", yPos);

            circle.transition()
                .duration(50)
                .attr("r", 5);

            const tooltipText = `<strong>Date:</strong> ${d.date.toLocaleDateString()}<br>
                                <strong>Daily Cases:</strong> ${d.dailyCases.toLocaleString()}`;

            const tooltipX = event.pageX + 15;
            const tooltipY = event.pageY - 30;

            d3.select('.covid-tooltip')
                .style("display", "block")
                .style("left", `${tooltipX}px`)
                .style("top", `${tooltipY}px`)
                .html(tooltipText);
        }


        function resetZoom() {
            svg.transition()
                .duration(750)
                .call(zoom.transform, d3.zoomIdentity);
        }

        resetButton.on('click', resetZoom);

        // Create tooltip
        if (d3.select('body').select('.covid-tooltip').empty()) {
            d3.select('body')
                .append('div')
                .attr('class', 'covid-tooltip hidden absolute z-50 bg-white p-2 text-xs md:text-sm rounded shadow-lg border border-gray-200')
                .style("display", "none");
        }

    }, [data, d]);

    return (
        <div className="relative w-full max-w-8xl mx-auto" ref={containerRef}>
            <div className="w-full h-full bg-zinc-800 rounded-xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.7)] dark:shadow-[0_20px_50px_rgba(2,_132,_199,_0.3)] p-4 md:p-6 border border-zinc-600" ref={svgRef}></div>
        </div>
    );

};
export default CovidLineChart;