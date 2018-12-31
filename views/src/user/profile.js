import React from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import '../css/user.css';
import { Col } from 'reactstrap';


function ProfilePicture({imagem}){
  imagem = String(imagem)
  return(
    <div id="profilePicture">
      <div className="blocos" id="photoPerfil" style={{backgroundImage: 'url(../images/user_images/9fa9cf08356e5ba1b8495f5fa6188479ce41.bmp)'}}></div>
    </div>
  )
}

function ProfileName({nome}) {
  return (
    <div>
      <p id="profileName" >{nome}</p>
      <div className="lineSeparator"></div>
    </div>
  )
}

function OnlineStatus(){
  return <p id="onlineStatus">Online</p>
}



function Profile({profile}){
    return (
      <Col md={{size: 2}}>
        <ProfilePicture imagem={profile.imagem}/>
        <ProfileName nome={profile.nome} />
        <OnlineStatus/>
      </Col>
    )
}

export default Profile
