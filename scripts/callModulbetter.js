/**
 * Created by antoni on 01.06.17.
 */
/**
 * Created by antoni on 23.05.17.
 */
window.addEventListener("load",function()
    {
        console.log("loaded");
        document.getElementById("registerBtn").addEventListener("click",register);
        document.getElementById("callBtn").addEventListener("click",callPeer);
        document.getElementById("addNewPeerBtn").addEventListener("click",addNewPeer);

        //initialise global variables
        var peer={};
        var grpPeers=[];
        var myStream;

        //register function


        function register() {

            navigator.getUserMedia({ audio: true, video: { width: 900, height: 520 }},
                function(stream) {
                    myStream= stream;
                    var video = document.getElementById("selfVideo");
                    video.srcObject = stream;
                    video.onloadedmetadata = function(e) {
                        video.play();
                    };
                },
                function(err) {
                    console.log("The following error occurred: " + err.name);
                }
            );
            console.log(myStream);
            //check for Name
            var name = document.getElementById("name").value;
            console.log(name);
            //generateID
            peer = new Peer(name, {key: 'cksskorc4w50o1or'});
            // Grab elements, create settings, etc.
            var video = document.getElementById('video');
            peer.on('open', function (id) {
                console.log(id);
            });
            //load userName
            var welcome = document.createElement("h2");
            welcome.innerHTML = "Hallo " + name;
            var cnt = document.getElementById("welcomeText");
            cnt.append(welcome);


            peer.on('call', function (call) {
                // Answer the call, providing our mediaStream
                navigator.getUserMedia({video: true, audio: true}, answer, fail);

                function answer(stream) //Angerufener erlaubt KameraNutzung
                {
                    call.answer(stream);
                    document.getElementById("selfVideo").srcObject = myStream;

                    call.on('stream', function (remoteStream) {

                        var newVideo=document.createElement('video');
                        newVideo.autoplay = true;
                        var newVideoCont=document.createElement("div");
                        newVideoCont.append(newVideo);
                        var nameP=document.createElement("p");
                        nameP.innerHTML=call.peer;
                        newVideoCont.append(nameP);
                        document.getElementsByClassName("videoCont")[0].append(newVideoCont);
                        newVideo.srcObject=remoteStream;


                    });
                }

                function fail() 			//Anrufer Verbietet Kameranutzung
                {
                    document.getElementById("partneraudio").src = '';  // Wählton abschalten.
                    alert("Kein Mediastream");
                }
            });
            peer.on('connection',function (conn) {
                // Jemand will einen Datastream aufbauen
                conn.on("data", (data) => {
                    // Jemand hat was Geschickt.
                    console.log(data);
                //Todo: handle(data);
                addStream(data,myStream);
            });

            })
        }
        //call
        function callPeer()
        {
            document.getElementById("selfVideo").srcObject = myStream;
            var receivePeer=document.getElementById("callPeer").value;
            call = peer.call(receivePeer,  myStream);
            var datastream1 = peer.connect(receivePeer);
            call.on('stream', function(remoteStream)
            {
                grpPeers.push(receivePeer);

                datastream1.send({msg:grpPeers[});
                console.log(grpPeers[i]);

                var newVideo=document.createElement('video');
                newVideo.autoplay = true;
                var newVideoCont=document.createElement("div");
                newVideoCont.append(newVideo);
                var nameP=document.createElement("p");
                nameP.innerHTML=receivePeer;
                newVideoCont.append(nameP);
                document.getElementsByClassName("videoCont")[0].append(newVideoCont);
                newVideo.srcObject=remoteStream;

            });
        }
        function addNewPeer()
        {
            document.getElementById("selfVideo").srcObject = myStream;
            var receivePeer=document.getElementById("addNewPeer").value;
            call = peer.call(receivePeer,  myStream);
            var datastream2 = peer.connect(receivePeer);
            call.on('stream', function(remoteStream)
            {
                grpPeers.push(receivePeer);
                for(var i=0;i<grpPeers.length-1;i++)
                {
                    if(receivePeer!==grpPeers[i])
                    {
                        datastream2.send({msg:grpPeers[i]});
                        console.log(grpPeers[i]);

                        /*datastream2=peer.connect(grpPeers[i]);
                         datastream2.send({msg:receivePeer});*/
                    }
                }
                var newVideo=document.createElement('video');
                newVideo.autoplay = true;
                var newVideoCont=document.createElement("div");
                newVideoCont.append(newVideo);
                var nameP=document.createElement("p");
                nameP.innerHTML=receivePeer;
                newVideoCont.append(nameP);
                document.getElementsByClassName("videoCont")[0].append(newVideoCont);
                newVideo.srcObject=remoteStream;

            });
        }

        //addNewStreamer
        function addStream(addedPeer,myStream)
        {
            call = peer.call(addedPeer.msg, myStream);
            call.on('stream',function (remoteStream) {
                var name=call.peer;
                generateVideo(name,remoteStream)
            })
        }
        function generateVideo(callPeer,remoteStream){
            var newVideo=document.createElement('video');
            newVideo.autoplay = true;
            var newVideoCont=document.createElement("div");
            newVideoCont.append(newVideo);
            var nameP=document.createElement("p");
            nameP.innerHTML=callPeer;
            newVideoCont.append(nameP);
            document.getElementsByClassName("videoCont")[0].append(newVideoCont);
            newVideo.srcObject=remoteStream;
        }
    }
);