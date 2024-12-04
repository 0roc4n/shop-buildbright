import { Injectable } from '@angular/core';
import { Storage, deleteObject, getDownloadURL, ref, uploadBytesResumable } from '@angular/fire/storage';
@Injectable({
  providedIn: 'root'
})
export class DataStorageService {

  constructor(private afStorage: Storage) { }

  async uploadProfilePic(userKey:string, imageBlob: Blob){
    const profileRef = ref(this.afStorage,`/profilePics/${userKey}`);
    await uploadBytesResumable(profileRef,imageBlob)
    return  await getDownloadURL(profileRef)
  }


  async uploadIds(userKey:string, idImageArray: any[]){
    return await Promise.all(idImageArray.map(async(image:any, index: number)=>{
        const blobs = await Promise.all([
          (await(await fetch(image.front)).blob()),
          (await(await fetch(image.back)).blob())
        ])
        const idImgRef = await Promise.all([
          await uploadBytesResumable(ref(this.afStorage,`/ids/${userKey}/${index}/front`),blobs[0]),
          await uploadBytesResumable(ref(this.afStorage,`/ids/${userKey}/${index}/back`),blobs[1]),
        ])
        return {
          front : await getDownloadURL(idImgRef[0].ref),
          back  : await getDownloadURL(idImgRef[1].ref)
        }
    }))
  }

  async uploadReturnPhotos(orderId: string, storeId:string, returnProdArray: any[]){
    return await Promise.all(returnProdArray.map(async(returnProd:any)=>{
      // if(returnProd.variants){
      //   return Promise.all(returnProd.variants.map((variant:any)=> 
      //     Promise.all(variant.pictures.map(async(picture:string, index: number)=>
      //           getDownloadURL((await uploadBytesResumable(ref(this.afStorage,`/returnProducts/${storeId}/${orderId}/${returnProd.productId}/${variant.variantIndex}/${index}`), await(await fetch(picture)).blob())).ref)
      //         )
      //       )
      //     )
      //   )
      // }
      // else{
        
        return Promise.all(returnProd.pictures.map(
          async (picture:string, index:number)=> 
            getDownloadURL(
              (await uploadBytesResumable(ref(this.afStorage,`/returnProducts/${storeId}/${orderId}/${returnProd.productId}/${index}`), 
                await(await fetch(picture)).blob())).ref) ) )
      // }
    }))

  }

}
