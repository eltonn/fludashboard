/* This code is almost entirely based on svg-crowbar-2.js from https://github.com/NYTimes/svg-crowbar
 A few modifications where added in order to:
 - Use it as a function, not booklet;
 - Cycle only up to 4th SVG source, since the remaining ones are not needed;
 - Receive SVG sequential number for single plot download;
 - Reload page after download.

 This is a result of discutions on StackOverflow:
 https://stackoverflow.com/questions/50750430/how-to-properly-generate-canvas-from-complex-svg/
 
 As the original svg-crowbar-2.js, this code is under MIT License as stated on svg-crowbar project repository:
 Copyright (c) 2013 The New York Times

 Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
function singleSVGcrowbar(myplot) {
    // Input:
    // var myplot = {SVGid: int, [SVGname: str]} : SVGid is the desired SVG sequential number on webpage.
    //                                                  SVGName is the desired output file name without extension. Optional.
    var doctype = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

    window.URL = (window.URL || window.webkitURL);

    var body = document.body,
        emptySvg;

    var prefix = {
        xmlns: "http://www.w3.org/2000/xmlns/",
        xlink: "http://www.w3.org/1999/xlink",
        svg: "http://www.w3.org/2000/svg"
    };

    initialize(myplot);

    function initialize(myplot) {
        var documents = [window.document],
            SVGSources = [];
        iframes = document.querySelectorAll("iframe"),
            objects = document.querySelectorAll("object");

        // add empty svg element
        var emptySvg = window.document.createElementNS(prefix.svg, 'svg');
        window.document.body.appendChild(emptySvg);
        var emptySvgDeclarationComputed = getComputedStyle(emptySvg);

        [].forEach.call(iframes, function(el) {
            try {
                if (el.contentDocument) {
                    documents.push(el.contentDocument);
                }
            } catch(err) {
                console.log(err);
            }
        });

        [].forEach.call(objects, function(el) {
            try {
                if (el.contentDocument) {
                    documents.push(el.contentDocument);
                }
            } catch(err) {
                console.log(err)
            }
        });

        documents.forEach(function(doc) {
            var newSources = getSources(doc, emptySvgDeclarationComputed);
            // On our system, we only need the first 18 SVG sources, not all of them:
            for (var i = 0; i < 18; i++) {
                SVGSources.push(newSources[i]);
            }
        });

        // Define name attribute for SVG, to be used as filename on download function:
        if (myplot.SVGname) {
            SVGSources[myplot.SVGid].name = myplot.SVGname;
        }
        download(SVGSources[myplot.SVGid]);
    }


    function getSources(doc, emptySvgDeclarationComputed) {
        var svgInfo = [],
            svgs = doc.querySelectorAll("svg");

        [].forEach.call(svgs, function (svg) {

            svg.setAttribute("version", "1.1");

            // removing attributes so they aren't doubled up
            svg.removeAttribute("xmlns");
            svg.removeAttribute("xlink");

            // These are needed for the svg
            if (!svg.hasAttributeNS(prefix.xmlns, "xmlns")) {
                svg.setAttributeNS(prefix.xmlns, "xmlns", prefix.svg);
            }

            if (!svg.hasAttributeNS(prefix.xmlns, "xmlns:xlink")) {
                svg.setAttributeNS(prefix.xmlns, "xmlns:xlink", prefix.xlink);
            }

            setInlineStyles(svg, emptySvgDeclarationComputed);

            var source = (new XMLSerializer()).serializeToString(svg);
            var rect = svg.getBoundingClientRect();
            svgInfo.push({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                class: svg.getAttribute("class"),
                id: svg.getAttribute("id"),
                name: svg.getAttribute("name"),
                childElementCount: svg.childElementCount,
                source: [doctype + source]
            });
        });
        return svgInfo;
    }

    function download(source) {
        var filename = "untitled";

        if (source.name) {
            filename = source.name;
        } else if (source.id) {
            filename = source.id;
        } else if (source.class) {
            filename = source.class;
        } else if (window.document.title) {
            filename = window.document.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        }

        var url = window.URL.createObjectURL(new Blob(source.source, { "type" : "text\/xml" }));

        var a = document.createElement("a");
        body.appendChild(a);
        a.setAttribute("class", "svg-crowbar");
        a.setAttribute("download", filename + ".svg");
        a.setAttribute("href", url);
        a.style["display"] = "none";
        a.click();

        setTimeout(function() {
            window.URL.revokeObjectURL(url);
        }, 10);

        // Reload page after download:
        window.location.reload();
    }


    function setInlineStyles(svg, emptySvgDeclarationComputed) {

        function explicitlySetStyle (element) {
            var cSSStyleDeclarationComputed = getComputedStyle(element);
            var i, len, key, value;
            var computedStyleStr = "";
            for (i=0, len=cSSStyleDeclarationComputed.length; i<len; i++) {
                key=cSSStyleDeclarationComputed[i];
                value=cSSStyleDeclarationComputed.getPropertyValue(key);
                if (value!==emptySvgDeclarationComputed.getPropertyValue(key)) {
                    computedStyleStr+=key+":"+value+";";
                }
            }
            element.setAttribute('style', computedStyleStr);
        }
        function traverse(obj){
            var tree = [];
            tree.push(obj);
            visit(obj);
            function visit(node) {
                if (node && node.hasChildNodes()) {
                    var child = node.firstChild;
                    while (child) {
                        if (child.nodeType === 1 && child.nodeName != 'SCRIPT'){
                            tree.push(child);
                            visit(child);
                        }
                        child = child.nextSibling;
                    }
                }
            }
            return tree;
        }
        // hardcode computed css styles inside svg
        var allElements = traverse(svg);
        var i = allElements.length;
        while (i--){
            explicitlySetStyle(allElements[i]);
        }
    }


};

